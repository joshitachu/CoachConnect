"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AppWindow, User, Apple, Activity, FileText, UserPlus } from "lucide-react"
import { useUser } from "@/lib/user-context"

export default function Sidebar() {
  const { isClient, isTrainer } = useUser()
  const router = useRouter()
  const pathname = usePathname() || ""
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab") || ""

  const clientTabs = [
    { id: "dashboard", label: "Dashboard", icon: AppWindow, href: "/dashboard?tab=dashboard" },
    { id: "chat", label: "Chat", icon: User, href: "/chat" },
    { id: "nutrition", label: "Nutrition", icon: Apple, href: "/dashboard?tab=nutrition" },
    { id: "workout", label: "Workout", icon: Activity, href: "/dashboard?tab=workout" },
    { id: "reports", label: "Reports", icon: FileText, href: "/dashboard?tab=reports" },
  ]

  const trainerTabs = [
    { id: "dashboard", label: "Dashboard", icon: AppWindow, href: "/dashboard?tab=dashboard" },
    { id: "clients", label: "Clients", icon: UserPlus, href: "/dashboard?tab=clients" },
    { id: "chat", label: "Chat", icon: User, href: "/chat" },
    { id: "nutrition", label: "Nutrition", icon: Apple, href: "/dashboard?tab=nutrition" },
    { id: "workout", label: "Workout", icon: Activity, href: "/dashboard?tab=workout" },
    { id: "reports", label: "Reports", icon: FileText, href: "/dashboard?tab=reports" },
  ]

  const tabs = isTrainer() ? trainerTabs : clientTabs

  // simple pathname-based active detection
  const activeId = (() => {
    if (pathname === "/formbuilder") return "form-builder"
    if (pathname.startsWith("/chat")) return "chat"
    if (pathname.startsWith("/dashboard")) {
      if (tabParam) return tabParam
      if (pathname.startsWith("/dashboard/clients")) return "clients"
      return "dashboard"
    }
    return ""
  })()

  return (
    <aside className="w-56 h-screen sticky top-0 bg-card/60 border-r border-border/30 p-6 flex flex-col items-center justify-between">
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

      {/* Forms Section */}
      <div className="w-full mt-8 flex flex-col items-center gap-3">
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
    </aside>
  )
}
