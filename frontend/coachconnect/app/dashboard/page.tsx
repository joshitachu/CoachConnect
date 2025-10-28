"use client"

import { useUser } from "@/lib/user-context"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import ChatList from "@/components/chat/ChatList"
import ChatWindow from "@/components/chat/ChatWindow"

export default function Dashboard() {
  const { user, isClient, isTrainer } = useUser()
  const [active, setActive] = useState<string>("dashboard")
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const tabParam = searchParams?.get("tab")

  useEffect(() => {
    // When user role becomes available, set a sensible default active tab
    if (!user) return
    // prefer explicit tab query param when present
    if (tabParam) {
      setActive(tabParam)
      return
    }

    // Default to dashboard tab
    setActive("dashboard")
    
    // if chat tab becomes active without a selected chat, pick first mock
    if (active === "chat" && !selectedChatId) {
      setSelectedChatId('c1')
    }
  }, [user, tabParam, active, selectedChatId])

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
          <h1 className="text-4xl font-bold">Hallo, {user.first_name}!</h1>
          <p className="text-muted-foreground mt-2">Client Scherm: {active}</p>
        </div>
      )
    }

    if (isTrainer()) {
      return (
        <div className="flex-1 p-8">
          <p className="text-muted-foreground mt-2">TTrainer scherm: {active}</p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      {renderContent()}
    </div>
  )
}