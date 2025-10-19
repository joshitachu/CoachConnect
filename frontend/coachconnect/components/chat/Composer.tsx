"use client"
import React, { useState } from "react"

export default function Composer({ onSendAction }: { onSendAction: (text: string) => void }) {
  const [text, setText] = useState("")

  function handleSend() {
    if (!text.trim()) return
    onSendAction(text.trim())
    setText("")
  }

  return (
    <div className="p-4 border-t border-border flex items-center gap-3 bg-background">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend() } }}
        placeholder="Type a message"
        className="flex-1 px-3 py-2 rounded-md border border-input bg-transparent"
      />
      <button onClick={handleSend} className="bg-primary text-primary-foreground px-3 py-2 rounded-md">Send</button>
    </div>
  )
}
