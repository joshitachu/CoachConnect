"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  country: string
  phone_number: string
  role: string  // "client" or "trainer"
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  logout: () => void
  isLoggedIn: () => boolean
  isTrainer: () => boolean
  isClient: () => boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)

  // No authentication: always allow
  useEffect(() => {}, [])

  const setUser = (newUser: User | null) => {
    setUserState(newUser)
  }

  const logout = () => {
    setUserState(null)
  }

  const isLoggedIn = () => {
    return user !== null
  }

  const isTrainer = () => {
    return user?.role === "trainer"
  }

  const isClient = () => {
    return user?.role === "client"
  }

  return (
    <UserContext.Provider value={{ user, setUser, logout, isLoggedIn, isTrainer, isClient }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}