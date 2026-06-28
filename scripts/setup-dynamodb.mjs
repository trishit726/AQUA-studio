// One-shot DynamoDB table provisioner for Aqua Studio.
//
//   1. Fill AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env
//      (AWS_REGION and AWS_DYNAMODB_TABLE_NAME are already set there).
//   2. Run:  node scripts/setup-dynamodb.mjs
//
// Creates the single table the app uses, with the composite key + sparse GSI1
// that app/lib/db.ts expects. Idempotent: re-running on an existing table is a
// no-op. Uses on-demand (PAY_PER_REQUEST) billing — no capacity to provision,
// scales to zero.
import "dotenv/config";
import {
  DynamoDBClient,
  CreateTableCommand,
  waitUntilTableExists,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

const region = (process.env.AWS_REGION || "us-east-1").trim();
const accessKeyId = process.env.AWS_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY?.trim();
const TableName = (process.env.AWS_DYNAMODB_TABLE_NAME || "pattern-studio").trim();

if (!accessKeyId || !secretAccessKey) {
  console.error(
    "\n✗ Missing credentials. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env, then re-run.\n",
  );
  process.exit(1);
}

const client = new DynamoDBClient({
  region,
  credentials: { accessKeyId, secretAccessKey },
});

const params = {
  TableName,
  BillingMode: "PAY_PER_REQUEST",
  AttributeDefinitions: [
    { AttributeName: "PK", AttributeType: "S" },
    { AttributeName: "SK", AttributeType: "S" },
    { AttributeName: "GSI1PK", AttributeType: "S" },
    { AttributeName: "GSI1SK", AttributeType: "N" },
  ],
  KeySchema: [
    { AttributeName: "PK", KeyType: "HASH" },
    { AttributeName: "SK", KeyType: "RANGE" },
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "GSI1",
      KeySchema: [
        { AttributeName: "GSI1PK", KeyType: "HASH" },
        { AttributeName: "GSI1SK", KeyType: "RANGE" },
      ],
      Projection: { ProjectionType: "ALL" },
    },
  ],
};

async function main() {
  console.log(`\nRegion:  ${region}`);
  console.log(`Table:   ${TableName}`);

  // Skip if it already exists.
  try {
    await client.send(new DescribeTableCommand({ TableName }));
    console.log(`\n✓ Table "${TableName}" already exists — nothing to do.\n`);
    return;
  } catch (err) {
    if (err?.name !== "ResourceNotFoundException") throw err;
  }

  console.log(`\nCreating table "${TableName}" (PK/SK + sparse GSI1, on-demand)…`);
  await client.send(new CreateTableCommand(params));

  console.log("Waiting for table to become ACTIVE…");
  await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName });

  console.log(`\n✓ Done. "${TableName}" is ready in ${region}.\n`);
}

main().catch((err) => {
  console.error("\n✗ Failed:", err?.message ?? err);
  if (err?.name === "UnrecognizedClientException" || err?.name === "InvalidSignatureException") {
    console.error("  → Your AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY look wrong.");
  }
  if (err?.name === "AccessDeniedException") {
    console.error("  → The key lacks dynamodb:CreateTable permission.");
  }
  process.exit(1);
});
