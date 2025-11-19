"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, ChevronRight, Loader2, AlertCircle, Users } from 'lucide-react'
import { useUser } from '@/lib/user-context'

interface Trainer {
  id: number
  first_name: string
  last_name: string
  email: string
  trainer_code: string
}

export default function SelectTrainerPage() {
  const router = useRouter()
  const { user, setSelectedTrainer } = useUser()
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selecting, setSelecting] = useState<number | null>(null)

  useEffect(() => {
    // Redirect if not a client
    if (user && user.role !== 'client') {
      router.push('/dashboard')
      return
    }

    fetchLinkedTrainers()
  }, [user, router])

  const fetchLinkedTrainers = async () => {
    try {
      const res = await fetch('/api/client/check-trainer', {
        credentials: 'include'
      })
      const data = await res.json()

      console.log('API Response:', data) // Debug log

      if (!res.ok) {
        setError('Failed to load trainers')
        return
      }

      // More defensive checking
      if (data.trainers && Array.isArray(data.trainers)) {
        console.log('Trainers received:', data.trainers) // Debug log
        
        // Validate trainer data
        const validTrainers = data.trainers.filter((t: any) => {
          const isValid = t.first_name && t.last_name
          if (!isValid) {
            console.warn('Invalid trainer data:', t)
          }
          return isValid
        })

        setTrainers(validTrainers)
        
        // If no valid trainers, redirect to onboarding
        if (validTrainers.length === 0) {
          console.log('No valid trainers, redirecting to onboarding')
          router.push('/onboarding/trainer')
        }
      } else {
        console.error('Invalid response format:', data)
        setError('Invalid response from server')
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectTrainer = async (trainer: Trainer) => {
    setSelecting(trainer.id)
    
    try {
      // Save selected trainer to context
      setSelectedTrainer({
        id: trainer.id,
        first_name: trainer.first_name,
        last_name: trainer.last_name,
        email: trainer.email,
        trainer_code: trainer.trainer_code
      })

      // Optional: Save to backend/session
      await fetch('/api/client/select-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainer_id: trainer.id }),
        credentials: 'include'
      })

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Select trainer error:', err)
      setError('Failed to select trainer')
      setSelecting(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your trainers...</p>
        </div>
      </div>
    )
  }

  if (error && trainers.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
              <p className="text-foreground">{error}</p>
              <Button onClick={fetchLinkedTrainers} variant="outline">
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Select Your Trainer
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Choose which trainer's dashboard you'd like to access
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {trainers.length === 1 ? (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                <p className="text-sm text-foreground">
                  You're linked with one trainer. Click below to continue.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                <p className="text-sm text-foreground">
                  You're linked with {trainers.length} trainers. Select one to continue.
                </p>
              </div>
            )}

            <div className="grid gap-4">
              {trainers.map((trainer, index) => (
                <Card 
                  key={trainer.id || index}
                  className="border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
                  onClick={() => handleSelectTrainer(trainer)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <GraduationCap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-lg">
                            {trainer.first_name} {trainer.last_name}
                          </h3>
                          {trainer.email && (
                            <p className="text-sm text-muted-foreground">
                              {trainer.email}
                            </p>
                          )}
                          {trainer.trainer_code && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Code: {trainer.trainer_code}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        {selecting === trainer.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="pt-4 border-t border-border/30">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/onboarding/trainer')}
              >
                Link with Another Trainer
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            © 2025 CoachConnect. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}