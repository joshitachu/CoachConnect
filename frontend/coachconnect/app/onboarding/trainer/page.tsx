"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, UserPlus, AlertCircle, CheckCircle, ChevronRight } from "lucide-react"
import { useUser } from "@/lib/user-context"

export default function TrainerOnboardingPage() {
  const router = useRouter()
  const { user, setUser, setSelectedTrainer, markLinkedTrainer } = useUser()
  const [step, setStep] = useState<"code" | "success">("code")
  const [trainerCode, setTrainerCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [linkedTrainer, setLinkedTrainer] = useState<any>(null)

  // Redirect if not a client
  useEffect(() => {
    if (user && user.role !== "client") {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleLinkTrainer = async () => {
    if (!trainerCode.trim()) {
      setError("Please enter a trainer code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/client/link-trainer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trainer_code: trainerCode.trim() }),
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok && data.success) {
        const t = data.trainer
        setLinkedTrainer(t)

        // Persist trainer selection locally if you use selectedTrainer
        setSelectedTrainer?.({
          id: t.id,
          first_name: t.first_name,
          last_name: t.last_name,
          email: t.email,
          trainer_code: t.trainer_code,
        })

        // Update user flags
        if (user) {
          setUser({
            ...user,
            has_linked_trainer: true,
            trainer_code: t.trainer_code,
          })
        }
        markLinkedTrainer(t.trainer_code)

        // 🚀 Go directly to the form after first link
        router.replace("/form")
      } else {
        setError(data.message || "Invalid trainer code. Please try again.")
      }
    } catch (err) {
      setError("Failed to connect. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // (Optional success screen kept for reference; usually we now redirect straight to /form)
  if (step === "code") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="bg-card/50 border-border/50 backdrop-blur-sm shadow-2xl">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-foreground">Connect with Your Trainer</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your trainer&apos;s code to get started
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-foreground flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <span>
                    You need to connect with a trainer to access your personalized dashboard. Please enter the trainer
                    code provided to you.
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trainer-code" className="text-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Trainer Code
                </Label>
                <Input
                  id="trainer-code"
                  type="text"
                  placeholder="Enter your trainer's code"
                  value={trainerCode}
                  onChange={(e) => {
                    setTrainerCode(e.target.value)
                    setError("")
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleLinkTrainer()}
                  className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11"
                  disabled={loading}
                />
                {error && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </p>
                )}
              </div>

              <Button
                onClick={handleLinkTrainer}
                disabled={loading || !trainerCode.trim()}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
              >
                {loading ? "Connecting..." : "Connect to Trainer"}
              </Button>

              <div className="text-center pt-4 border-t border-border/30">
                <p className="text-xs text-muted-foreground">Don&apos;t have a trainer code? Contact your trainer.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Unused when we redirect immediately, but left for completeness
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-center">
                <CardTitle className="text-2xl font-bold text-foreground">Connected Successfully!</CardTitle>
                <CardDescription className="text-muted-foreground mt-2">
                  You&apos;re now linked with {linkedTrainer?.first_name} {linkedTrainer?.last_name}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="space-y-2">
                <p className="text-sm text-foreground font-medium">Trainer Information</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>Name:</strong> {linkedTrainer?.first_name} {linkedTrainer?.last_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {linkedTrainer?.email}
                  </p>
                  <p>
                    <strong>Code:</strong> {linkedTrainer?.trainer_code}
                  </p>
                </div>
              </div>
            </div>

            <Button onClick={() => router.replace("/form")} className="w-full h-11 bg-primary hover:bg-primary/90">
              Continue to Form
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
