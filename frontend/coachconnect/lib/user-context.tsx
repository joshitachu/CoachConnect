"use client"
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useRef,
  useMemo,
} from "react"

type Role = "client" | "trainer"

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  country: string
  phone_number: string
  role: Role
  has_linked_trainer?: boolean
  has_completed_onboarding?: boolean     // NEW
  trainer_code?: string | null           // NEW
}

interface SelectedTrainer {
  id: number
  first_name: string
  last_name: string
  email: string
  trainer_code: string
}

interface UserContextType {
  user: User | null
  setUser: (user: User | null) => void
  selectedTrainer: SelectedTrainer | null
  setSelectedTrainer: (trainer: SelectedTrainer | null) => void
  logout: () => Promise<void>
  isLoggedIn: () => boolean
  isTrainer: () => boolean
  isClient: () => boolean
  hasLinkedTrainer: () => boolean
  getTrainerCode: () => string | null
  // Convenience setters (optional, but handy)
  markLinkedTrainer: (code: string | null) => void
  markOnboardingComplete: () => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null)
  const [selectedTrainer, setSelectedTrainerState] = useState<SelectedTrainer | null>(null)
  const hydrated = useRef(false)

  // Hydrate selectedTrainer from localStorage + user from /api/me on first mount
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    try {
      const storedTrainer = localStorage.getItem("selectedTrainer")
      if (storedTrainer) setSelectedTrainerState(JSON.parse(storedTrainer))
    } catch {
      localStorage.removeItem("selectedTrainer")
    }

    ;(async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" })
        const data = await res.json().catch(() => ({}))
        const u = data?.user
        if (u) {
          setUserState((prev) => ({
            // always merge latest server state to avoid stale flags
            ...(prev ?? {}),
            id: Number(u.id),
            first_name: u.first_name ?? "",
            last_name: u.last_name ?? "",
            email: u.email,
            country: u.country ?? "N/A",
            phone_number: u.phone_number ?? "N/A",
            role: (u.role as Role) ?? "client",
            has_linked_trainer: u.has_linked_trainer ?? false,
            has_completed_onboarding: u.has_completed_onboarding ?? false,
            trainer_code: u.trainer_code ?? null,
          }))
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  const setUser = (newUser: User | null) => setUserState(newUser)

  const setSelectedTrainer = (trainer: SelectedTrainer | null) => {
    setSelectedTrainerState(trainer)
    try {
      if (trainer) localStorage.setItem("selectedTrainer", JSON.stringify(trainer))
      else localStorage.removeItem("selectedTrainer")
    } catch {
      // ignore storage errors
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" })
    } catch {
      // ignore
    }
    setUserState(null)
    setSelectedTrainerState(null)
    try { localStorage.removeItem("selectedTrainer") } catch {}
  }

  const isLoggedIn = () => user !== null
  const isTrainer = () => user?.role === "trainer"
  const isClient = () => user?.role === "client"
  const hasLinkedTrainer = () => Boolean(user?.has_linked_trainer)

  // Prefer explicitly selected trainer code, then fallback to user.trainer_code (from backend/session)
  const getTrainerCode = () =>
    selectedTrainer?.trainer_code ?? (user?.trainer_code ?? null)

  // Convenience updaters for common flows
  const markLinkedTrainer = (code: string | null) => {
    setUserState((prev) => (prev ? { ...prev, has_linked_trainer: true, trainer_code: code } : prev))
  }
  const markOnboardingComplete = () => {
    setUserState((prev) => (prev ? { ...prev, has_completed_onboarding: true } : prev))
  }

  const value = useMemo<UserContextType>(
    () => ({
      user,
      setUser,
      selectedTrainer,
      setSelectedTrainer,
      logout,
      isLoggedIn,
      isTrainer,
      isClient,
      hasLinkedTrainer,
      getTrainerCode,
      markLinkedTrainer,
      markOnboardingComplete,
    }),
    [user, selectedTrainer]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used within a UserProvider")
  return ctx
}
