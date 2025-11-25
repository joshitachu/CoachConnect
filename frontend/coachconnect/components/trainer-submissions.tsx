"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

export default function TrainerSubmissions() {
  const { user, getTrainerCode } = useUser()
  const [loading, setLoading] = useState(true)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

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

  if (loading) return <Card className="p-4"><CardContent>Loading submissions…</CardContent></Card>
  if (error) return <Card className="p-4"><CardContent className="text-destructive">{error}</CardContent></Card>

  return (
    <div className="space-y-4">
      <Card>
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
                      <div className="text-sm text-muted-foreground">{s.email}</div>
                      <div className="text-xs text-muted-foreground">Submitted: {new Date(s.submitted_at).toLocaleString()}</div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <Button size="sm" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                        {expandedId === s.id ? "Hide" : "View"}
                      </Button>
                    </div>
                  </div>

                  {expandedId === s.id && (
                    <pre className="mt-3 overflow-auto text-sm bg-muted p-3 rounded">{JSON.stringify(s.form_data, null, 2)}</pre>
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
