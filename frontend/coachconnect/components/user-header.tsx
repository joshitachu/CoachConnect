"use client"

import { useUser } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function UserHeader() {
  const { user, logout, isLoggedIn } = useUser()
  const router = useRouter()

  if (!isLoggedIn()) {
    return null
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="fixed bottom-4 left-4 z-[9999]">
      <div className="flex items-center gap-3 bg-card/95 backdrop-blur-md border border-border/50 rounded-lg px-4 py-2 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}