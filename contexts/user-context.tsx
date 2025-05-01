"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin"
  avatar?: string
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  register: (name: string, email: string, password: string) => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        // In a real app, this would verify the session with your backend
        const savedUser = localStorage.getItem("pdf_annotations_user")
        if (savedUser) {
          setUser(JSON.parse(savedUser))
        }
      } catch (error) {
        console.error("Failed to restore session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    // Only run in browser environment
    if (typeof window !== "undefined") {
      checkSession()
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // In a real app, this would make an API call to your auth endpoint
      // Simulating authentication for demo purposes
      if (email && password) {
        const mockUser: User = {
          id: `user_${Date.now()}`,
          name: email.split("@")[0],
          email,
          role: "user",
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split("@")[0])}&background=random`,
        }

        setUser(mockUser)
        localStorage.setItem("pdf_annotations_user", JSON.stringify(mockUser))
      } else {
        throw new Error("Invalid credentials")
      }
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true)
    try {
      // In a real app, this would make an API call to your registration endpoint
      // Simulating registration for demo purposes
      if (name && email && password) {
        const mockUser: User = {
          id: `user_${Date.now()}`,
          name,
          email,
          role: "user",
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`,
        }

        setUser(mockUser)
        localStorage.setItem("pdf_annotations_user", JSON.stringify(mockUser))
      } else {
        throw new Error("Invalid registration data")
      }
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("pdf_annotations_user")
  }

  return <UserContext.Provider value={{ user, isLoading, login, logout, register }}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
