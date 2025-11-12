"use client"

import { useState, useEffect } from "react"
import { useUser } from "@/lib/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Mail, Phone, MapPin, Shield, Save, Loader2, Check, X, Key, Copy, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const { user, setUser, isTrainer } = useUser()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    country: "",
    phone_number: "",
  })
  
  const [trainerCode, setTrainerCode] = useState("")
  const [originalTrainerCode, setOriginalTrainerCode] = useState("")
  
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState("")
  const [trainerCodeError, setTrainerCodeError] = useState("")
  const [trainerCodeSuccess, setTrainerCodeSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fetch trainer code on mount if user is trainer
  useEffect(() => {
    if (user && isTrainer()) {
      fetchTrainerCode()
    }
  }, [user, isTrainer])

  const fetchTrainerCode = async () => {
    try {
      const res = await fetch("/api/trainercode", {
        method: "GET",
        credentials: "include",
      })
      const data = await res.json()
      if (res.ok && data.trainer_code) {
        setTrainerCode(data.trainer_code)
        setOriginalTrainerCode(data.trainer_code)
      }
    } catch (err) {
      console.error("Fout bij ophalen trainer code:", err)
    }
  }

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        country: user.country === "N/A" ? "" : user.country || "",
        phone_number: user.phone_number === "N/A" ? "" : user.phone_number || "",
      })
    }
  }, [user])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError("")
    setIsSaved(false)
  }

  const handleTrainerCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")
    setTrainerCode(value)
    setTrainerCodeError("")
    setTrainerCodeSuccess(false)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError("")
    setIsSaved(false)

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Er is iets misgegaan")
      }

      if (user) {
        setUser({
          ...user,
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          country: formData.country || "N/A",
          phone_number: formData.phone_number || "N/A",
        })
      }

      setIsSaved(true)
      setTimeout(() => setIsSaved(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Er is een fout opgetreden")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTrainerCodeSubmit = async () => {
  setTrainerCodeError("")
  setTrainerCodeSuccess(false)

  if (!trainerCode || trainerCode.length < 6) {
    setTrainerCodeError("Trainer code moet minimaal 6 karakters bevatten")
    return
  }

  setIsLoading(true)

  try {
    const res = await fetch("/api/koppelcodechange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        trainer_code: trainerCode,
        email: user?.email, // 👈 send email too
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || "Trainer code wijzigen mislukt")
    }

    setOriginalTrainerCode(trainerCode)
    setTrainerCodeSuccess(true)
    setTimeout(() => setTrainerCodeSuccess(false), 3000)
  } catch (err) {
    setTrainerCodeError(err instanceof Error ? err.message : "Er is een fout opgetreden")
  } finally {
    setIsLoading(false)
  }
}


  const handleGenerateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    let code = ""
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setTrainerCode(code)
    setTrainerCodeError("")
    setTrainerCodeSuccess(false)
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(trainerCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getUserInitials = () => {
    if (!user) return "?"
    const first = formData.first_name?.[0] || ""
    const last = formData.last_name?.[0] || ""
    return (first + last).toUpperCase() || user.email?.[0]?.toUpperCase() || "?"
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            ← Terug
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Instellingen</h1>
            <p className="text-muted-foreground">Beheer jouw account en voorkeuren</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {getUserInitials()}
              </div>
              <div>
                <CardTitle>Profiel Informatie</CardTitle>
                <CardDescription>
                  Update je persoonlijke gegevens
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Voornaam
                  </Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Achternaam
                  </Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                />
              </div>

              {/* Phone & Country */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefoonnummer
                  </Label>
                  <Input
                    id="phone_number"
                    name="phone_number"
                    value={formData.phone_number}
                    onChange={handleInputChange}
                    placeholder="+31 6 12345678"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Land
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Nederland"
                  />
                </div>
              </div>

              {/* Role (Read-only) */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Account Type
                </Label>
                <div className="px-4 py-2 bg-muted rounded-md">
                  <p className="text-sm font-medium capitalize">{user?.role || "Gebruiker"}</p>
                </div>
              </div>

              {/* Error & Success Messages */}
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                  <X className="h-4 w-4" />
                  {error}
                </div>
              )}
              {isSaved && (
                <div className="flex items-center gap-2 text-green-600 text-sm bg-green-100 dark:bg-green-900/20 p-3 rounded-md">
                  <Check className="h-4 w-4" />
                  Wijzigingen opgeslagen!
                </div>
              )}

              {/* Save Button */}
              <Button onClick={handleSubmit} disabled={isLoading} className="w-full gap-2">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Opslaan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Wijzigingen Opslaan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trainer Code Card - Only for Trainers */}
        {isTrainer() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Trainer Code
              </CardTitle>
              <CardDescription>
                Deel deze code met je cliënten zodat zij zich kunnen koppelen aan jouw account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="trainer_code">Jouw Trainer Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="trainer_code"
                      name="trainer_code"
                      value={trainerCode}
                      onChange={handleTrainerCodeChange}
                      placeholder="TRAINER123"
                      className="font-mono text-lg tracking-wider uppercase"
                      maxLength={12}
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyCode}
                      disabled={!trainerCode}
                      className="gap-2"
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Gekopieerd!" : "Kopieer"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Minimaal 6 karakters, alleen hoofdletters en cijfers
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={handleGenerateCode}
                  className="w-full gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Genereer Nieuwe Code
                </Button>

                {trainerCodeError && (
                  <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                    <X className="h-4 w-4" />
                    {trainerCodeError}
                  </div>
                )}
                {trainerCodeSuccess && (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-100 dark:bg-green-900/20 p-3 rounded-md">
                    <Check className="h-4 w-4" />
                    Trainer code succesvol bijgewerkt!
                  </div>
                )}

                <Button
                  onClick={handleTrainerCodeSubmit}
                  disabled={isLoading || trainerCode === originalTrainerCode}
                  className="w-full gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Trainer Code Opslaan
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}