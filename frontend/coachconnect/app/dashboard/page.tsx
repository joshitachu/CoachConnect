"use client"

import { UserHeader } from "@/components/user-header"
import { useUser } from "@/lib/user-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { AppWindow, User, Apple, Activity, FileText, UserPlus } from "lucide-react"
import ChatList from "@/components/chat/ChatList"
import ChatWindow from "@/components/chat/ChatWindow"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const { user, isClient, isTrainer } = useUser()
  const [active, setActive] = useState<string>("dashboard")
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab")

  // Using emojis as icons for stability (no external icon import errors)
  // Dashboard first so it's always on top for clients
  const clientTabs = [
    { id: "dashboard", label: "Dashboard", icon: AppWindow },
    { id: "chat", label: "Chat", icon: User },
    { id: "nutrition", label: "Nutrition", icon: Apple },
  { id: "workout", label: "Workout", icon: Activity },
  { id: "reports", label: "Reports", icon: FileText },
  ]

  const trainerTabs = [
    { id: "dashboard", label: "Dashboard", icon: AppWindow },
    { id: "clients", label: "Clients", icon: UserPlus },
    { id: "chat", label: "Chat", icon: User },
    { id: "nutrition", label: "Nutrition", icon: Apple },
    { id: "workout", label: "Workout", icon: Activity },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "form-builder", label: "Form", icon: FileText },
  ]

  useEffect(() => {
    // When user role becomes available, set a sensible default active tab
    if (!user) return
    // prefer explicit tab query param when present
    if (tabParam) {
      setActive(tabParam)
      return
    }

    if (isTrainer()) {
      setActive(trainerTabs[0].id)
    } else if (isClient()) {
      setActive(clientTabs[0].id)
    }
    // if chat tab becomes active without a selected chat, pick first mock
    if (active === "chat" && !selectedChatId) {
      setSelectedChatId('c1')
    }
  }, [user])

  const router = useRouter()
  const renderSidebar = () => {
    const tabs = isClient() ? clientTabs : trainerTabs
    return (
      <aside className="w-56 h-screen sticky top-0 bg-card/60 border-r border-border/30 p-6 flex items-center justify-center">
        <nav className="space-y-8 flex flex-col items-center w-full">
            {tabs.map((t) => {
            // t can be either a string (trainerTabs) or an object (clientTabs)
            const id = typeof t === "string" ? t : t.id
            const label = typeof t === "string" ? (t === "form-builder" ? "Form Builder" : `Tab ${t}`) : t.label
            const IconComp = typeof t === "string" ? null : t.icon

            return (
              <Button
                key={id}
                variant={active === id ? "default" : "ghost"}
                className="w-44 justify-start items-center gap-3 py-3 px-4 rounded-lg"
                onClick={() => {
                  if (id === "form-builder") {
                    router.push("/")
                    return
                  }
                  setActive(id)
                  // if clicking chat tab, ensure we have a selected chat
                  if (id === 'chat' && !selectedChatId) setSelectedChatId('c1')
                }}
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  {IconComp ? (
                    <IconComp
                      className={active === id ? "h-6 w-6 text-primary-foreground" : "h-6 w-6 text-primary"}
                      strokeWidth={2.5}
                    />
                  ) : null}
                </div>
                <span className="font-bold tracking-[0.16em] text-base">{label}</span>
              </Button>
            )
          })}
        </nav>
      </aside>
    )
  }

  const renderContent = () => {
    if (!user) return null

    // If the Chat tab is active, render the chat UI in the right area
    if (active === "chat") {
      const chats = [
        { id: 'c1', title: 'Anne', lastMessage: 'See you tomorrow', unreadCount: 1, updatedAt: new Date().toISOString() },
        { id: 'c2', title: 'Group Squad', lastMessage: 'Agenda has been updated', unreadCount: 0, updatedAt: new Date().toISOString() },
        { id: 'c3', title: 'Marcus', lastMessage: 'Thanks!', unreadCount: 0, updatedAt: new Date().toISOString() },
      ]

      return (
        <div className="flex-1 flex">
          <ChatList chats={chats} onSelectAction={(id: string) => setSelectedChatId(id)} activeId={selectedChatId ?? chats[0].id} />
          <div className="flex-1">
            <ChatWindow chatId={selectedChatId ?? chats[0].id} chatTitle={chats.find(c=>c.id=== (selectedChatId ?? chats[0].id))?.title} />
          </div>
        </div>
      )
    }

    if (isClient()) {
      return (
        <div className="flex-1 p-8">
          <h1 className="text-4xl font-bold">Welcome back, {user.first_name}!</h1>
          <p className="text-muted-foreground mt-2">Client view — active tab: {active}</p>
        </div>
      )
    }

    if (isTrainer()) {
      return (
        <div className="flex-1 p-8">
          <h1 className="text-4xl font-bold">Hier komt de trainers dashboard :)</h1>
          <p className="text-muted-foreground mt-2">Trainer view — active tab: {active}</p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      <UserHeader />
      <main className="flex-1">
        {renderContent()}
      </main>
    </div>
  )
}