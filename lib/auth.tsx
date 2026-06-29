"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import {
  ClerkProvider,
  useAuth,
  useUser,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"

interface AppAuthContextType {
  isSignedIn: boolean
  userId: string | null
  userName: string | null
  userEmail: string | null
  getToken: () => Promise<string | null>
  AuthUI: React.ReactNode
}

const AppAuthContext = createContext<AppAuthContextType | null>(null)

const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

const isClerkEnabled =
  typeof PUBLISHABLE_KEY === "string" &&
  PUBLISHABLE_KEY !== "" &&
  PUBLISHABLE_KEY !== "pk_test_..."

// Wrapper component that uses Clerk hooks safely
const ClerkAuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, userId, getToken } = useAuth()
  const { user } = useUser()

  const authValue: AppAuthContextType = {
    isSignedIn: !!isSignedIn,
    userId: userId ?? null,
    userName: user?.fullName ?? user?.username ?? null,
    userEmail: user?.primaryEmailAddress?.emailAddress ?? null,
    getToken: async () => {
      try {
        return await getToken()
      } catch (e) {
        console.error("[v0] Failed to get Clerk token", e)
        return null
      }
    },
    AuthUI: isSignedIn ? (
      <div className="flex items-center gap-2.5">
        <span className="text-sm text-muted-foreground">
          {user?.fullName ?? user?.username}
        </span>
        <UserButton afterSignOutUrl="/" />
      </div>
    ) : (
      <SignInButton mode="modal">
        <Button size="sm">Sign in</Button>
      </SignInButton>
    ),
  }

  return (
    <AppAuthContext.Provider value={authValue}>{children}</AppAuthContext.Provider>
  )
}

// Frictionless anonymous identity — used when no Clerk key is configured.
//
// There is NO login step. Every visitor is silently assigned a persistent,
// auto-generated device id (stored in localStorage) that becomes their DynamoDB
// partition key. Save / load / cloud library all work immediately, for anyone,
// with zero sign-in. (Clerk remains available as an *optional* account layer if
// a publishable key is ever configured — but it is never required to use the app.)
const AnonymousAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const KEY = "aqua_anon_id"
    let id = window.localStorage.getItem(KEY)
    if (!id) {
      const rand =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      id = `anon-${rand}`
      window.localStorage.setItem(KEY, id)
    }
    setUserId(id)
  }, [])

  const authValue: AppAuthContextType = {
    // Always "signed in" — no gate. userId resolves on mount (one tick).
    isSignedIn: true,
    userId,
    userName: "Guest",
    userEmail: null,
    getToken: async () => null,
    AuthUI: null,
  }

  return (
    <AppAuthContext.Provider value={authValue}>{children}</AppAuthContext.Provider>
  )
}

export const AppAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isClerkEnabled) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY as string}>
        <ClerkAuthWrapper>{children}</ClerkAuthWrapper>
      </ClerkProvider>
    )
  }
  return <AnonymousAuthProvider>{children}</AnonymousAuthProvider>
}

export const useAppAuth = () => {
  const context = useContext(AppAuthContext)
  if (!context) {
    throw new Error("useAppAuth must be used within an AppAuthProvider")
  }
  return context
}
