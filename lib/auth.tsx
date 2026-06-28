"use client"

import React, { createContext, useContext, useState } from "react"
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

// Mock auth provider used when no Clerk key is configured.
const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mockUser, setMockUser] = useState<string | null>(null)

  const handleLogin = () => {
    const name =
      typeof window !== "undefined"
        ? window.prompt("Enter a guest username to simulate an account:")
        : null
    if (name && name.trim()) setMockUser(name.trim())
  }

  const handleLogout = () => setMockUser(null)

  const authValue: AppAuthContextType = {
    isSignedIn: !!mockUser,
    userId: mockUser ? `mock_${mockUser.toLowerCase().replace(/\s+/g, "_")}` : null,
    userName: mockUser,
    userEmail: mockUser ? `${mockUser.toLowerCase()}@example.com` : null,
    getToken: async () => "mock-session-token",
    AuthUI: mockUser ? (
      <div className="flex items-center gap-2.5">
        <span className="text-sm text-muted-foreground">Guest: {mockUser}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Sign out
        </Button>
      </div>
    ) : (
      <Button size="sm" onClick={handleLogin}>
        Sign in
      </Button>
    ),
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
  return <MockAuthProvider>{children}</MockAuthProvider>
}

export const useAppAuth = () => {
  const context = useContext(AppAuthContext)
  if (!context) {
    throw new Error("useAppAuth must be used within an AppAuthProvider")
  }
  return context
}
