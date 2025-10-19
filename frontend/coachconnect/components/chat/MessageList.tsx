"use client"
import React, { useRef, useEffect } from "react"
import { Message } from "./types"
import MessageBubble from "./MessageBubble"

export function MessageList({ messages, currentUserId }: { messages: Message[]; currentUserId?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // scroll to bottom when messages change
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages])

  return (
    <div ref={ref} className="h-[70vh] overflow-auto p-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} isOwn={m.senderId === currentUserId} />
      ))}
    </div>
  )
}

export default MessageList
