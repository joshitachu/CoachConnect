// app/select-trainer/page.tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, ArrowRight, Loader2, Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { Input } from "@/components/ui/input"

interface Trainer {
  id: number
  first_name: string
  last_name: string
  email: string
  trainer_code?: string
}

export default function SelectTrainerPage() {
  const router = useRouter()
  const { user, isClient, setSelectedTrainer } = useUser()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [selecting, setSelecting] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    // Redirect trainers directly to dashboard
    if (user && !isClient()) {
      router.push("/dashboard")
      return
    }

    // Always show trainer selection for clients on every login
    fetchTrainers()
  }, [user, isClient, router])

  const fetchTrainers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/trainers/available")
      const data = await res.json()
      
      if (data.trainers) {
        setTrainers(data.trainers)
      }
    } catch (err) {
      console.error("Failed to fetch trainers:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTrainer = async (trainerId: number) => {
    setSelecting(trainerId)
    try {
      const res = await fetch("/api/client/select-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainer_id: trainerId }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // Redirect to dashboard with selected trainer context
        router.push("/dashboard")
      } else {
        alert(data.message || "Failed to select trainer")
        setSelecting(null)
      }
    } catch (err) {
      console.error("Error selecting trainer:", err)
      alert("Failed to select trainer")
      setSelecting(null)
    }
  }

  const filteredTrainers = trainers.filter(trainer => {
    const fullName = `${trainer.first_name} ${trainer.last_name}`.toLowerCase()
    const email = trainer.email.toLowerCase()
    const query = searchQuery.toLowerCase()
    
    return fullName.includes(query) || email.includes(query)
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading trainers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.first_name || 'Client'}!
          </h1>
          <p className="text-muted-foreground">
            Select which trainer's environment you'd like to access today
          </p>
        </div>

        {trainers.length > 0 && (
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trainers by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {filteredTrainers.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No trainers found matching "{searchQuery}"</p>
          </div>
        )}

        {filteredTrainers.length === 0 && !searchQuery && (
          <Card className="bg-card/50 border-border/50">
            <CardContent className="py-12 text-center">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-foreground font-medium mb-2">No Trainers Available</p>
              <p className="text-sm text-muted-foreground">
                You don't have any trainers linked to your account yet.
                Contact your trainer to get their code.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {filteredTrainers.map((trainer) => (
            <Card 
              key={trainer.id}
              className="bg-card/50 border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => selecting === null && handleSelectTrainer(trainer.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {trainer.first_name} {trainer.last_name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {trainer.email}
                      </CardDescription>
                    </div>
                  </div>
                  {selecting === trainer.id ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  ) : (
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {trainer.trainer_code && (
                  <div className="text-xs text-muted-foreground">
                    Code: {trainer.trainer_code}
                  </div>
                )}
                <Button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (selecting === null) handleSelectTrainer(trainer.id)
                  }}
                  disabled={selecting !== null}
                  className="w-full mt-3"
                  variant="outline"
                >
                  {selecting === trainer.id ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Selecting...
                    </>
                  ) : (
                    <>
                      Select Trainer
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/logout")}
            className="text-muted-foreground hover:text-foreground"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}