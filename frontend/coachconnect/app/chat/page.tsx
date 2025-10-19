"use client"

import React, { useState } from "react"
import ChatList from "@/components/chat/ChatList"
import ChatWindow from "@/components/chat/ChatWindow"
import { ChatSummary } from "@/components/chat/types"

export default function ChatPage() {
  const [active, setActive] = useState<string>('c1')

  const chats: ChatSummary[] = [
    { id: 'c1', title: 'Anne', lastMessage: 'See you tomorrow', unreadCount: 1, updatedAt: new Date().toISOString() },
    { id: 'c2', title: 'Group Squad', lastMessage: 'Agenda has been updated', unreadCount: 0, updatedAt: new Date().toISOString() },
    { id: 'c3', title: 'Marcus', lastMessage: 'Thanks!', unreadCount: 0, updatedAt: new Date().toISOString() },
  ]

  return (
    <div className="flex h-screen">
      <ChatList chats={chats} onSelectAction={setActive} activeId={active} />
      <ChatWindow chatId={active} chatTitle={chats.find(c=>c.id===active)?.title} />
    </div>
  )
}
