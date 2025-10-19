"use client"
import React from "react"
import { Message } from "./types"

export function MessageBubble({ message, isOwn }: { message: Message; isOwn?: boolean }) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}> 
      <div className={`${isOwn ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'} max-w-[70%] p-3 rounded-md`}> 
        <div className="text-sm">{message.content}</div>
        <div className="text-xs text-muted-foreground mt-1 text-right">{new Date(message.createdAt).toLocaleTimeString()}</div>
      </div>
    </div>
  )
}

export default MessageBubble
