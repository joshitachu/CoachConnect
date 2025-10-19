export type ChatSummary = {
  id: string
  title: string
  avatarUrl?: string | null
  lastMessage?: string
  unreadCount?: number
  updatedAt?: string
}

export type Message = {
  id: string
  chatId: string
  senderId: string
  senderName?: string
  content: string
  type?: 'text' | 'image' | 'system'
  createdAt: string
}
