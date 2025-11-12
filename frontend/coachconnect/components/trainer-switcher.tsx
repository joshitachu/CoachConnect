"use client"

import { Button } from "@/components/ui/button"
import { GraduationCap, ChevronDown } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function TrainerSwitcher() {
  const { selectedTrainer, isClient } = useUser()
  const router = useRouter()

  // Only show for clients with a selected trainer
  if (!isClient() || !selectedTrainer) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium">
              {selectedTrainer.first_name} {selectedTrainer.last_name}
            </div>
            <div className="text-xs text-muted-foreground">
              Current Trainer
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Trainer Environment</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/select-trainer")}>
          <GraduationCap className="h-4 w-4 mr-2" />
          Switch Trainer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
