"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"

/**
 * Hook to ensure clients have selected a trainer before accessing protected pages
 * Use this in dashboard and other pages that require trainer context
 */
export function useRequireTrainer() {
  const router = useRouter()
  const { user, selectedTrainer, isClient } = useUser()

  useEffect(() => {
    // If user is a client and hasn't selected a trainer, redirect to selection
    if (user && isClient() && !selectedTrainer) {
      router.push("/select-trainer")
    }
  }, [user, selectedTrainer, isClient, router])

  return { user, selectedTrainer, isClient }
}