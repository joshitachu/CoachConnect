"use client"
import React, { useState } from "react"
import { Message } from "./types"
import MessageList from "./MessageList"
import Composer from "./Composer"

export default function ChatWindow({ chatId, chatTitle }: { chatId: string; chatTitle?: string }) {
  // mock messages state
  const [messages, setMessages] = useState<Message[]>([
    { id: 'm1', chatId, senderId: 'u2', senderName: 'Anne', content: 'Hey, how are you?', createdAt: new Date().toISOString() },
    { id: 'm2', chatId, senderId: 'u1', senderName: 'You', content: 'All good — working on the project.', createdAt: new Date().toISOString() },
  ])

  function handleSend(text: string) {
    const m: Message = { id: String(Date.now()), chatId, senderId: 'u1', senderName: 'You', content: text, createdAt: new Date().toISOString() }
    setMessages((s) => [...s, m])
  }

  return (
    <div className="flex-1 flex flex-col h-screen">
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="font-semibold">{chatTitle}</div>
      </div>
      <MessageList messages={messages} currentUserId={'u1'} />
      <Composer onSendAction={handleSend} />
    </div>
  )
}
