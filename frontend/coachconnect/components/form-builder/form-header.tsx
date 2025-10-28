"use client"

import { Button } from "@/components/ui/button"
import { User, Dumbbell, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import { useFormStore } from "@/lib/form-store"

export function FormHeader() {
  const { currentForm } = useFormStore()
  const { user, isLoggedIn, logout } = useUser()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Dumbbell className="h-6 w-6 text-primary drop-shadow-sm" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent drop-shadow-sm">
                CoachConnect
              </h1>
              {currentForm && (
                <p className="text-sm text-muted-foreground">
                  {currentForm.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn() && user && (
              <div className="flex items-center gap-3 bg-card/80 backdrop-blur-sm border border-border/30 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.role === 'trainer' ? 'Trainer' : 'Client'}
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
