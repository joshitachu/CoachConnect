"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AppWindow, User, Apple, Activity, FileText, UserPlus, ChevronDown, LogOut, Settings } from "lucide-react"
import { useUser } from "@/lib/user-context"
import { useState } from "react"

export default function Sidebar() {
  const { user, isClient, isTrainer, logout } = useUser()
  const router = useRouter()
  const pathname = usePathname() || ""
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab") || ""
  const [profileOpen, setProfileOpen] = useState(false)

  const clientTabs = [
    { id: "dashboard", label: "Dashboard", icon: AppWindow, href: "/dashboard?tab=dashboard" },
    { id: "chat", label: "Chat", icon: User, href: "/chat" },
  { id: "nutrition", label: "Nutrition", icon: Apple, href: "/nutrition" },
    { id: "workout", label: "Workout", icon: Activity, href: "/dashboard?tab=workout" },
    { id: "reports", label: "Reports", icon: FileText, href: "/dashboard?tab=reports" },
  ]

  const trainerTabs = [
    { id: "dashboard", label: "Dashboard", icon: AppWindow, href: "/dashboard?tab=dashboard" },
    { id: "clients", label: "Clients", icon: UserPlus, href: "/dashboard?tab=clients" },
    { id: "chat", label: "Chat", icon: User, href: "/chat" },
  { id: "nutrition", label: "Nutrition", icon: Apple, href: "/nutrition" },
    { id: "workout", label: "Workout", icon: Activity, href: "/dashboard?tab=workout" },
    { id: "reports", label: "Reports", icon: FileText, href: "/dashboard?tab=reports" },
  ]

  const tabs = isTrainer() ? trainerTabs : clientTabs

  const activeId = (() => {
    if (pathname === "/formbuilder") return "form-builder"
  if (pathname.startsWith("/chat")) return "chat"
  if (pathname.startsWith("/nutrition")) return "nutrition"
    if (pathname.startsWith("/dashboard")) {
      if (tabParam) return tabParam
      if (pathname.startsWith("/dashboard/clients")) return "clients"
      return "dashboard"
    }
    return ""
  })()

  const canSeeForms = isTrainer()

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const getUserInitials = () => {
    if (!user) return "?"
    const first = user.first_name?.[0] || ""
    const last = user.last_name?.[0] || ""
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?"
  }

  const getUserDisplayName = () => {
    if (!user) return "Gebruiker"
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`
    }
    if (user.first_name) return user.first_name
    if (user.last_name) return user.last_name
    return user.email
  }

  return (
    <aside className="w-56 h-screen sticky top-0 bg-card/60 border-r border-border/30 p-6 flex flex-col justify-between">
      {/* Top: Navigation */}
      <nav className="space-y-8 flex flex-col items-center w-full">
        {tabs.map((t) => {
          const IconComp = t.icon
          const id = t.id
          return (
            <Button
              key={id}
              variant={activeId === id ? "default" : "ghost"}
              className="w-44 justify-start items-center gap-3 py-3 px-4 rounded-lg"
              onClick={() => router.push(t.href)}
            >
              <div className="w-7 h-7 flex items-center justify-center">
                <IconComp
                  className={activeId === id ? "h-6 w-6 text-primary-foreground" : "h-6 w-6 text-primary"}
                  strokeWidth={2.5}
                />
              </div>
              <span className="font-bold tracking-[0.16em] text-base">{t.label}</span>
            </Button>
          )
        })}
      </nav>

      {/* Bottom: Forms + Profile */}
      <div className="w-full flex flex-col items-center gap-6">
        {/* Forms Section — trainers only */}
        {canSeeForms && (
          <div className="w-full flex flex-col items-center gap-3">
            <div className="w-full border-t border-border/20 mb-3 pt-4">
              <span className="block text-xs font-semibold text-muted-foreground mb-2 px-2 tracking-widest uppercase">Forms</span>
              <Button
                variant={pathname.startsWith("/forms") ? "default" : "ghost"}
                className="w-44 justify-start items-center gap-3 py-2 px-4 rounded-lg mb-1"
                onClick={() => router.push("/forms")}
              >
                <FileText className="h-5 w-5 mr-2" />
                My Forms
              </Button>
              <Button
                variant={pathname === "/formbuilder" ? "default" : "outline"}
                className="w-44 justify-start items-center gap-3 py-2 px-4 rounded-lg"
                onClick={() => router.push("/formbuilder")}
              >
                <span className="h-5 w-5 mr-2 flex items-center justify-center text-lg font-bold">+</span>
                Submit New Form
              </Button>
            </div>
          </div>
        )}

        {/* Profile Section */}
        <div className="w-full border-t border-border/20 pt-4">
          <div className="relative">
            {/* Profile Button */}
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                {getUserInitials()}
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <p className="text-sm font-semibold truncate">{getUserDisplayName()}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || "gebruiker"}</p>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Dropdown Menu */}
            {profileOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden">
                {/* User Info */}
                <div className="p-4 border-b border-border bg-accent/20">
                  <p className="text-sm font-semibold">{getUserDisplayName()}</p>
                  <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Role:</span> <span className="capitalize">{user?.role}</span>
                    </p>
                    {user?.country && user.country !== "N/A" && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Land:</span> {user.country}
                      </p>
                    )}
                    {user?.phone_number && user.phone_number !== "N/A" && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Telefoon:</span> {user.phone_number}
                      </p>
                    )}
                  </div>
                </div>

                {/* Menu Items */}
                <div className="p-2">
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      router.push("/profile")
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-accent transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Instellingen
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-destructive/10 text-destructive transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Uitloggen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}