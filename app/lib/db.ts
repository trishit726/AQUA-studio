import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb"
import { randomUUID } from "node:crypto"
import { withCache, invalidate } from "./cache"

/**
 * Aqua Studio — DynamoDB data layer (single-table design).
 *
 * Everything lives in ONE table. Each user owns one "item collection" (every
 * item that shares their partition key), so all of a user's data is retrievable
 * with single-partition Queries — no scatter-gather, no table Scans.
 *
 *   Primary key
 *     PK (HASH)  "USER#<userId>"
 *     SK (RANGE) "SCENE#<sceneId>"              -> a saved scene
 *                "RENDER#<paddedTs>#<renderId>" -> a render-history event
 *
 *   GSI1 (sparse — only Scene items carry GSI1PK/GSI1SK)
 *     GSI1PK (HASH)  "USER#<userId>"
 *     GSI1SK (RANGE) updatedAt (Number)
 *     -> lists a user's scenes ordered by most-recently-edited. Render events
 *        omit these attributes so they never appear in (or cost anything on)
 *        this index.
 *
 * Access patterns:
 *   getScene            GetItem    PK + SK                       (strongly consistent)
 *   listScenes          Query      GSI1, ScanIndexForward=false  (recency order)
 *   saveScene           UpdateItem PK + SK, if_not_exists(createdAt)
 *   deleteScene         DeleteItem PK + SK, attribute_exists(PK) (ownership = the key)
 *   recordRender        PutItem    PK + SK
 *   listRenders         Query      PK + begins_with(SK,"RENDER#"), reverse
 *
 * Ownership is enforced by the key, not by application code: a caller can only
 * ever address items inside their own "USER#<userId>" partition.
 */

// Trim credentials defensively: a stray space or newline from copy/paste
// corrupts the SigV4 Authorization header and yields a confusing
// "Invalid key=value pair (missing equal-sign)" error from AWS.
const region = (process.env.AWS_REGION || "us-east-1").trim()
const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim()
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim()

const client = new DynamoDBClient({
  region,
  // When explicit credentials are present we pass them through; otherwise let
  // the SDK resolve them from the standard provider chain (Vercel OIDC / IAM
  // roles inject them ambiently).
  ...(accessKeyId && secretAccessKey
    ? { credentials: { accessKeyId, secretAccessKey } }
    : {}),
})

export const db = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    // Scene props can contain optional/undefined fields — strip them so the
    // SDK does not throw when serializing the item.
    removeUndefinedValues: true,
  },
})

/** Single table holding every entity type (scenes + render history). */
export const TABLE_NAME =
  process.env.AWS_DYNAMODB_TABLE_NAME?.trim() || "pattern-studio-scenes"

/** Name of the sparse recency index over a user's scenes. */
export const SCENES_BY_RECENCY_INDEX = "GSI1"

// ---------------------------------------------------------------------------
// Key construction. Centralised so the key schema is defined in exactly one
// place and can never drift between read and write paths.
// ---------------------------------------------------------------------------

const userPk = (userId: string) => `USER#${userId}`
const sceneSk = (sceneId: string) => `SCENE#${sceneId}`

// Cache key for a user's recency-ordered scene list (see listScenes).
const scenesCacheKey = (userId: string) => `scenes:${userId}`

// Zero-pad the timestamp so lexicographic SK ordering == chronological order.
// Date.now() is ~13 digits today; 15 leaves head-room well past the year 5000.
const renderSk = (createdAt: number, renderId: string) =>
  `RENDER#${String(createdAt).padStart(15, "0")}#${renderId}`

// ---------------------------------------------------------------------------
// Public types — the clean shapes the API layer speaks. Internal key/index
// attributes (PK, SK, GSI1PK, GSI1SK, entityType) never leak past this module.
// ---------------------------------------------------------------------------

export interface Scene {
  id: string
  userId: string
  /**
   * Which template/composition this scene is an instance of (e.g.
   * "PatternTitle", "TitleCard", "TransparentOverlay"). Scenes are polymorphic:
   * a single per-user item collection holds many different graphic types,
   * distinguished by this field. Defaults to "PatternTitle" for rows written
   * before templates existed.
   */
  template: string
  name: string
  props: unknown
  duration: number
  createdAt: number
  updatedAt: number
}

export interface RenderEvent {
  id: string
  userId: string
  composition: string
  durationSec: number
  status: string
  createdAt: number
}

const toScene = (item: Record<string, any>): Scene => ({
  id: item.sceneId,
  userId: item.userId,
  template: item.template || "PatternTitle",
  name: item.name,
  props: item.props,
  duration: item.duration,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
})

// ---------------------------------------------------------------------------
// Pagination. DynamoDB caps every Query at 1 MB, so list endpoints MUST page
// rather than assume one round-trip returns everything. We expose an opaque,
// base64url cursor that wraps DynamoDB's LastEvaluatedKey — the client passes it
// back verbatim to fetch the next page, and never has to know the key schema.
// ---------------------------------------------------------------------------

/** A single page of results plus the cursor for the next one (null = last page). */
export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

const DEFAULT_PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100

/** Render-history events auto-expire after 90 days via DynamoDB TTL. */
const RENDER_TTL_SECONDS = 90 * 24 * 60 * 60

const clampLimit = (limit?: number) =>
  Math.min(Math.max(Math.trunc(limit ?? DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE)

const encodeCursor = (key?: Record<string, any>): string | null =>
  key ? Buffer.from(JSON.stringify(key)).toString("base64url") : null

const decodeCursor = (
  cursor?: string | null,
): Record<string, any> | undefined => {
  if (!cursor) return undefined
  try {
    return JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"))
  } catch {
    // A malformed cursor is treated as "start from the beginning" rather than a
    // hard error — clients can't wedge themselves with a bad token.
    return undefined
  }
}

// ---------------------------------------------------------------------------
// Access patterns.
// ---------------------------------------------------------------------------

/**
 * Create or update a scene. Idempotent on re-save: `createdAt` is preserved via
 * `if_not_exists`, and `updatedAt`/`GSI1SK` advance so the scene jumps to the
 * top of the recency index. Uses UpdateItem (not Put) so a partial re-save
 * never clobbers fields we didn't send.
 */
export async function saveScene(input: {
  id: string
  userId: string
  template: string
  name: string
  props: unknown
  duration: number
}): Promise<Scene> {
  const now = Date.now()
  const { id, userId, template, name, props, duration } = input

  const result = await db.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPk(userId), SK: sceneSk(id) },
      UpdateExpression:
        "SET entityType = :type, sceneId = :sid, userId = :uid, " +
        "template = :template, #name = :name, props = :props, " +
        "#duration = :duration, updatedAt = :now, " +
        "createdAt = if_not_exists(createdAt, :now), " +
        "GSI1PK = :gsi1pk, GSI1SK = :now",
      // `name` and `duration` are DynamoDB reserved words.
      ExpressionAttributeNames: { "#name": "name", "#duration": "duration" },
      ExpressionAttributeValues: {
        ":type": "Scene",
        ":sid": id,
        ":uid": userId,
        ":template": template,
        ":name": name,
        ":props": props,
        ":duration": duration,
        ":now": now,
        ":gsi1pk": userPk(userId),
      },
      ReturnValues: "ALL_NEW",
    }),
  )

  // This user's recency list just changed — drop its cached copy so the next
  // listScenes reflects the save immediately within this instance.
  invalidate(scenesCacheKey(userId))

  return toScene(result.Attributes!)
}

/**
 * Fetch a single scene by id within its owner's partition. Strongly consistent
 * so a load immediately after a save never reads a stale copy (the recency
 * list, by contrast, tolerates eventual consistency — see listScenes).
 * Returns null when the scene does not exist OR is not owned by `userId`.
 */
export async function getScene(
  userId: string,
  id: string,
): Promise<Scene | null> {
  const result = await db.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { PK: userPk(userId), SK: sceneSk(id) },
      ConsistentRead: true,
    }),
  )
  return result.Item ? toScene(result.Item) : null
}

/**
 * List a user's scenes, most-recently-edited first, via the sparse GSI1.
 * A single-partition, paginated Query — cost scales with the page size, never
 * with this user's total scene count nor the size of the table.
 *
 * Only the first page (no cursor, default size) is cached; deep pages bypass the
 * cache so a paging client always reads through to DynamoDB.
 */
export async function listScenes(
  userId: string,
  opts: { limit?: number; cursor?: string | null } = {},
): Promise<Page<Scene>> {
  const limit = clampLimit(opts.limit)
  const ExclusiveStartKey = decodeCursor(opts.cursor)

  const run = async (): Promise<Page<Scene>> => {
    const result = await db.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: SCENES_BY_RECENCY_INDEX,
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": userPk(userId) },
        ScanIndexForward: false, // newest updatedAt first
        Limit: limit,
        ...(ExclusiveStartKey ? { ExclusiveStartKey } : {}),
      }),
    )
    return {
      items: (result.Items || []).map(toScene),
      nextCursor: encodeCursor(result.LastEvaluatedKey),
    }
  }

  // Cache only the canonical first page (invalidated on every save/delete).
  const isFirstPage = !opts.cursor && limit === DEFAULT_PAGE_SIZE
  return isFirstPage ? withCache(scenesCacheKey(userId), run) : run()
}

/**
 * Delete a scene. The `attribute_exists(PK)` condition means the write only
 * succeeds if an item actually exists at this user's key — so a caller can
 * never delete a scene they don't own, and we never have to read-then-check.
 * Returns false when there was nothing to delete (missing or not owned).
 */
export async function deleteScene(
  userId: string,
  id: string,
): Promise<boolean> {
  try {
    await db.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: userPk(userId), SK: sceneSk(id) },
        ConditionExpression: "attribute_exists(PK)",
      }),
    )
    invalidate(scenesCacheKey(userId))
    return true
  } catch (err: any) {
    if (err?.name === "ConditionalCheckFailedException") return false
    throw err
  }
}

/**
 * Append a render-history event to the user's partition. No GSI1 attributes,
 * so render events stay out of the (sparse) scene recency index. The SK is
 * time-sortable, so listRenders needs no secondary index of its own.
 */
export async function recordRender(input: {
  userId: string
  composition: string
  durationSec: number
  status: string
}): Promise<RenderEvent> {
  const now = Date.now()
  const id = randomUUID()
  const event: RenderEvent = {
    id,
    userId: input.userId,
    composition: input.composition,
    durationSec: input.durationSec,
    status: input.status,
    createdAt: now,
  }

  await db.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: userPk(input.userId),
        SK: renderSk(now, id),
        entityType: "Render",
        // DynamoDB TTL (epoch SECONDS) auto-expires render history after 90
        // days, so the time-series side of each user's partition stays bounded
        // and old events cost nothing. Scenes carry no ttl and live forever.
        ttl: Math.floor(now / 1000) + RENDER_TTL_SECONDS,
        ...event,
      },
    }),
  )

  return event
}

/**
 * List a user's render history, newest first — paginated. Reuses the primary
 * key: renders sit in the same partition as that user's scenes, isolated by the
 * "RENDER#" sort-key prefix, so this is a single Query with no extra index.
 */
export async function listRenders(
  userId: string,
  opts: { limit?: number; cursor?: string | null } = {},
): Promise<Page<RenderEvent>> {
  const limit = clampLimit(opts.limit)
  const ExclusiveStartKey = decodeCursor(opts.cursor)

  const result = await db.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
      ExpressionAttributeValues: {
        ":pk": userPk(userId),
        ":prefix": "RENDER#",
      },
      ScanIndexForward: false,
      Limit: limit,
      ...(ExclusiveStartKey ? { ExclusiveStartKey } : {}),
    }),
  )
  return {
    items: (result.Items || []).map((i) => ({
      id: i.id,
      userId: i.userId,
      composition: i.composition,
      durationSec: i.durationSec,
      status: i.status,
      createdAt: i.createdAt,
    })),
    nextCursor: encodeCursor(result.LastEvaluatedKey),
  }
}
