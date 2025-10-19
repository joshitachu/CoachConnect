"use client"

import React from "react"
import { ChatSummary } from "./types"

export function ChatList({ chats, onSelectAction, activeId }: { chats: ChatSummary[]; onSelectAction: (id: string) => void; activeId?: string }) {
  return (
    <div className="w-80 border-r border-border/40 h-screen overflow-auto bg-card p-4">
      <h3 className="text-sm font-semibold text-muted-foreground mb-3">Chats</h3>
      <div className="space-y-2">
        {chats.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelectAction(c.id)}
            className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-accent/40 transition-colors ${activeId === c.id ? 'bg-primary/10' : ''}`}
          >
            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center overflow-hidden">
              {c.avatarUrl ? <img src={c.avatarUrl} alt={c.title} className="w-full h-full object-cover" /> : <div className="text-sm font-bold text-primary">{c.title?.slice(0,1)}</div>}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-sm">{c.title}</div>
                <div className="text-xs text-muted-foreground">{c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString() : ''}</div>
              </div>
              <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
            </div>
            {c.unreadCount ? <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">{c.unreadCount}</div> : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatList
