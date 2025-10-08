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

  // Load user from localStorage on component mount
  useEffect(() => {
    const savedUser = localStorage.getItem('coachconnect_user')
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser))
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('coachconnect_user')
      }
    }
  }, [])

  const setUser = (newUser: User | null) => {
    setUserState(newUser)
    if (newUser) {
      localStorage.setItem('coachconnect_user', JSON.stringify(newUser))
    } else {
      localStorage.removeItem('coachconnect_user')
    }
  }

  const logout = () => {
    setUserState(null)
    localStorage.removeItem('coachconnect_user')
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