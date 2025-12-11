"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { useUser } from "@/lib/user-context"

interface Submission {
  id: number
  client_id: number
  form_data: Record<string, any>
  trainers_code: string
  submitted_at: string
  email?: string
  first_name?: string
  last_name?: string
}

export default function TrainerSubmissions({ compact = false }: { compact?: boolean }) {
  const { user, getTrainerCode } = useUser()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({})
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set())

  function markSeen(id: number) {
    setSeenIds(prev => {
      const s = new Set(prev)
      s.add(id)
      return s
    })
  }

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      setError(null)

      const trainers_code = getTrainerCode()
      const query = trainers_code ? `?trainers_code=${encodeURIComponent(trainers_code)}` : user?.email ? `?email=${encodeURIComponent(user.email)}` : ""

      if (!query) {
        setError("No trainer context available")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/form-submissions${query}`, { cache: "no-store" })
        if (!res.ok) {
          const txt = await res.text().catch(() => "")
          throw new Error(txt || `HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!mounted) return
        setSubmissions(data.submissions || [])
        // Also fetch form schemas to map field ids to labels
        try {
          const trainerEmail = user?.email
          if (trainerEmail) {
            const formsRes = await fetch(`/api/formshowfortrainer?email=${encodeURIComponent(trainerEmail)}`, { cache: "no-store" })
            if (formsRes.ok) {
              const formsJson = await formsRes.json().catch(() => ({}))
              const schemas = formsJson.form_schemas || []
              const map: Record<string, string> = {}
              for (const f of schemas) {
                const fields = f?.fields || []
                for (const fld of fields) {
                  if (fld?.id && fld?.label) map[fld.id] = fld.label
                }
              }
              if (mounted) setFieldLabels(map)
            }
          }
        } catch (e) {
          // ignore label mapping errors
        }
      } catch (e: any) {
        console.error("Failed to load submissions", e)
        if (!mounted) return
        setError(e?.message || "Failed to load submissions")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [user, getTrainerCode])

  if (loading) return <Card className="p-2"><CardContent className={compact ? "p-2 text-sm" : "p-4"}>Loading submissions…</CardContent></Card>
  if (error) return <Card className="p-2"><CardContent className="text-destructive">{error}</CardContent></Card>

  // Compact mode: small card, show up to 5 items, minimal spacing
  if (compact) {
    const list = submissions.slice(0, 5)
    return (
      <Card className="p-3 max-w-md">
            <CardHeader className="flex justify-center">
              <div className="inline-flex items-center gap-2">
                <CardTitle className="text-lg font-semibold text-center">Recent Submissions</CardTitle>
                {submissions && submissions.length > 0 && (
                  (() => {
                    const unread = submissions.filter(s => !seenIds.has(s.id)).length
                    return unread > 0 ? (
                      <span className="inline-flex items-center justify-center bg-red-600 text-white text-xs font-medium rounded-full w-6 h-6">{unread}</span>
                    ) : null
                  })()
                )}
              </div>
            </CardHeader>
        <CardContent className="p-2">
          {list.length === 0 ? (
            <div className="text-xs text-muted-foreground">No submissions</div>
          ) : (
            <div className="space-y-2">
              {list.map((s) => (
                <div key={s.id} className="flex items-center justify-between border-b pb-1"> 
                  <div className="min-w-0">
                    <div className="text-sm truncate font-medium">{s.first_name || "Unknown"}{s.last_name ? ` ${s.last_name}` : ""}</div>
                  </div>
                  <div className="ml-3 flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleDateString()}</div>
                    <Dialog>
                      <DialogTrigger asChild>
                            <Button size="sm" onClick={() => markSeen(s.id)}>Open</Button>
                      </DialogTrigger>
                      <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="text-xl font-semibold">Submission from {s.first_name || s.email}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-3 max-h-72 overflow-auto">
                            <div className="space-y-4">
                              {Object.entries(s.form_data || {}).map(([key, val]) => (
                                <div key={key}>
                                  <div className="text-base font-semibold">{fieldLabels[key] ?? key}</div>
                                  <div className="text-sm text-muted-foreground mt-1 break-words">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="mt-4 flex gap-2 justify-center">
                            <Button size="sm" onClick={() => { window.location.href = `/chat?client=${encodeURIComponent(s.email || '')}` }}>
                              Start chatting
                            </Button>
                            <DialogClose asChild>
                              <Button size="sm" className="bg-red-600 text-white hover:bg-red-700">Decline</Button>
                            </DialogClose>
                          </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Default (regular) rendering
  return (
    <div className="space-y-4">
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Recent Onboarding Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-sm text-muted-foreground">No submissions yet.</div>
          ) : (
            <div className="space-y-3">
              {submissions.map((s) => (
                <div key={s.id} className="border rounded-md p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium">{s.first_name || s.email || "Unknown"} {s.last_name ? ` ${s.last_name}` : ""}</div>
                      <div className="text-xs text-muted-foreground">Submitted: {new Date(s.submitted_at).toLocaleString()}</div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Button size="sm" onClick={() => {
                        const isOpen = expandedId === s.id
                        const newId = isOpen ? null : s.id
                        setExpandedId(newId)
                        if (!isOpen) markSeen(s.id)
                      }}>
                        {expandedId === s.id ? "Hide" : "View"}
                      </Button>
                    </div>
                  </div>

                  {expandedId === s.id && (
                    <div className="mt-3 overflow-auto text-sm bg-muted p-3 rounded">
                      <div className="space-y-4">
                        {Object.entries(s.form_data || {}).map(([key, val]) => (
                          <div key={key}>
                            <div className="text-base font-semibold">{fieldLabels[key] ?? key}</div>
                            <div className="text-sm text-muted-foreground mt-1">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</div>
                          </div>
                        ))}

                        <div className="mt-2 flex gap-2 justify-center">
                          <Button size="sm" onClick={() => { window.location.href = `/chat?client=${encodeURIComponent(s.email || '')}` }}>
                            Start chatting
                          </Button>
                          <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={() => setExpandedId(null)}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
