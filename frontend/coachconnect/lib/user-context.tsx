"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react"

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  country: string
  phone_number: string
  role: string  // "client" or "trainer"
}

interface SelectedTrainer {
  id: number
  first_name: string
  last_name: string
  email: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  selectedTrainer: SelectedTrainer | null
  setSelectedTrainer: (trainer: SelectedTrainer | null) => void
  logout: () => void
  isLoggedIn: () => boolean
  isTrainer: () => boolean
  isClient: () => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [selectedTrainer, setSelectedTrainerState] = useState<SelectedTrainer | null>(null)

  const hydrated = useRef(false)
  
  // 🔹 HYDRATE FROM /api/me ON FIRST MOUNT
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    ;(async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" })
        const data = await res.json()

        if (data?.user) {
          const u = data.user

          setUserState(prev => prev ?? {
            id: Number(u.id),
            first_name: u.first_name ?? "",
            last_name: u.last_name ?? "",
            email: u.email,
            country: u.country ?? "N/A",
            phone_number: u.phone_number ?? "N/A",
            role: u.role,
          })
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  const setUser = (newUser: User | null) => setUserState(newUser)
  
  const setSelectedTrainer = (trainer: SelectedTrainer | null) => {
    setSelectedTrainerState(trainer)
  }

  const logout = async () => {
    try { await fetch("/api/logout", { method: "POST" }) } catch {}
    setUserState(null)
    setSelectedTrainerState(null) // Clear selected trainer on logout
  }

  const isLoggedIn = () => user !== null
  const isTrainer = () => user?.role === "trainer"
  const isClient  = () => user?.role === "client"

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      selectedTrainer,
      setSelectedTrainer,
      logout, 
      isLoggedIn, 
      isTrainer, 
      isClient 
    }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) throw new Error("useUser must be used within a UserProvider")
  return context
}