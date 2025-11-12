"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, ArrowRight } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function TrainerEnvironmentBanner() {
  const { selectedTrainer, isClient } = useUser()
  const router = useRouter()

  // Only show for clients with a selected trainer
  if (!isClient() || !selectedTrainer) {
    return null
  }

  return (
    <Alert className="mb-6 bg-primary/5 border-primary/20">
      <GraduationCap className="h-4 w-4 text-primary" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-sm">
          You're viewing <span className="font-semibold">{selectedTrainer.first_name} {selectedTrainer.last_name}'s</span> environment
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/select-trainer")}
          className="text-primary hover:text-primary/80"
        >
          Switch Trainer
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
