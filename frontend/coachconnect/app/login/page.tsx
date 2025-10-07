"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Lock, LogIn, ArrowLeft, Shield, GraduationCap } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [trainerCode, setTrainerCode] = useState("")
  const [userRole, setUserRole] = useState("client")

  const handleLogin = () => {
    // Simpele navigatie naar de form builder
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute top-6 left-6">
        <Link href="/">
          <Button variant="outline" className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Button>
        </Link>
      </div>
      
      <div className="w-full max-w-md">
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Sign in to CoachConnect Form Builder
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={userRole} onValueChange={setUserRole} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/30">
                <TabsTrigger value="client" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                  <User className="h-4 w-4 mr-2" />
                  Client
                </TabsTrigger>
                <TabsTrigger value="trainer" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Trainer
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username-client" className="text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="username-client"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-client" className="text-foreground flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="password-client"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trainerCode" className="text-foreground flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Trainer Code
                    </Label>
                    <Input
                      id="trainerCode"
                      type="text"
                      placeholder="Enter trainer code (optional)"
                      value={trainerCode}
                      onChange={(e) => setTrainerCode(e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty for personal use or enter code to join trainer environment
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="trainer" className="space-y-4 mt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username-trainer" className="text-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Username
                    </Label>
                    <Input
                      id="username-trainer"
                      type="text"
                      placeholder="Enter your trainer username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-trainer" className="text-foreground flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </Label>
                    <Input
                      id="password-trainer"
                      type="password"
                      placeholder="Enter your trainer password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11"
                    />
                  </div>

                  <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm text-foreground flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <span className="font-medium">Trainer Login</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Access trainer dashboard and manage client environments
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4">
              <Button 
                onClick={handleLogin}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign In as {userRole === "trainer" ? "Trainer" : "Client"}
              </Button>

              <div className="text-center">
                <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Forgot your password?
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border/30">
              <p className="text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/signup" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign up
                </Link>
              </p>
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