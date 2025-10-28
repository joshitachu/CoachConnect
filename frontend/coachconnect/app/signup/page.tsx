"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Lock, UserPlus, Phone, Globe, UserCheck, GraduationCap, AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { validateSignupForm } from "@/lib/login-validation"
import { useToast } from "@/components/ui/use-toast"

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [country, setCountry] = useState("")
  const [userRole, setUserRole] = useState("client")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true })
    
    // Validate on blur
    const validation = validateSignupForm({
      firstName,
      lastName,
      email: username,
      password,
      phoneNumber,
      country,
    })
    
    if (!validation.isValid) {
      setErrors(validation.errors)
    } else {
      setErrors({})
    }
  }

  const handleSignUp = async () => {
    // Mark all fields as touched
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      phoneNumber: true,
      country: true,
    })

    // Validate all fields
    const validation = validateSignupForm({
      firstName,
      lastName,
      email: username,
      password,
      phoneNumber,
      country,
    })
    
    if (!validation.isValid) {
      setErrors(validation.errors)
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        variant: "destructive",
      })
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      // Create FormData object as the backend expects Form data
      const formData = new FormData()
      formData.append('first_name', firstName)
      formData.append('last_name', lastName)
      formData.append('email', username) // Using username as email
      formData.append('password', password)
      formData.append('country', country)
      formData.append('phone_number', phoneNumber)
      formData.append('role', userRole) // Add role information

      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Account Created Successfully!",
          description: `Welcome to CoachConnect, ${firstName}! Redirecting to login...`,
        })
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        const errorData = await response.json()
        toast({
          title: "Registration Failed",
          description: errorData.detail || "Something went wrong. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error during signup:', error)
      toast({
        title: "Network Error",
        description: "Make sure your backend is running on http://localhost:8000",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSignUp()
    }
  }

  const countries = [
    "Netherlands", "Belgium", "Germany", "France", "United Kingdom", 
    "Spain", "Italy", "Portugal", "Switzerland", "Austria",
    "Denmark", "Sweden", "Norway", "Finland", "Poland",
    "Czech Republic", "Hungary", "Romania", "Bulgaria", "Croatia",
    "United States", "Canada", "Australia", "New Zealand", "Other"
  ]

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Card className="bg-card/50 border-border/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Create Account
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Join CoachConnect Form Builder today
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
                <div className="p-3 bg-blue-500/5 rounded-lg border border-blue-500/20 mb-4">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Client Account</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Access your personal dashboard and view assigned forms
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="trainer" className="space-y-4 mt-6">
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20 mb-4">
                  <p className="text-sm text-foreground flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="font-medium">Trainer Account</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create and manage forms, track client progress
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  First Name
                </Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Enter first name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value)
                    if (touched.firstName) handleBlur('firstName')
                  }}
                  onBlur={() => handleBlur('firstName')}
                  onKeyPress={handleKeyPress}
                  className={`bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11 ${touched.firstName && errors.firstName ? 'border-red-500' : ''}`}
                />
                {touched.firstName && errors.firstName && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.firstName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Last Name
                </Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Enter last name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value)
                    if (touched.lastName) handleBlur('lastName')
                  }}
                  onBlur={() => handleBlur('lastName')}
                  onKeyPress={handleKeyPress}
                  className={`bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11 ${touched.lastName && errors.lastName ? 'border-red-500' : ''}`}
                />
                {touched.lastName && errors.lastName && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.lastName}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="Enter your email address"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value.toLowerCase().trim()
                    setUsername(value)
                    if (touched.email) {
                      const validation = validateSignupForm({
                        firstName,
                        lastName,
                        email: value,
                        password,
                        phoneNumber,
                        country
                      })
                      setErrors(validation.errors)
                    }
                  }}
                  onBlur={() => handleBlur('email')}
                  onKeyPress={handleKeyPress}
                  className={`bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11 ${touched.email && errors.email ? 'border-red-500' : ''}`}
                />
                {touched.email && errors.email && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.email}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      if (touched.password) handleBlur('password')
                    }}
                    onBlur={() => handleBlur('password')}
                    onKeyPress={handleKeyPress}
                    className={`bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11 pr-10 ${touched.password && errors.password ? 'border-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.password}</span>
                  </div>
                )}
                {!errors.password && (
                  <p className="text-xs text-muted-foreground">
                    Password should be at least 8 characters long
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-foreground flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    if (touched.phoneNumber) handleBlur('phoneNumber')
                  }}
                  onBlur={() => handleBlur('phoneNumber')}
                  onKeyPress={handleKeyPress}
                  className={`bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11 ${touched.phoneNumber && errors.phoneNumber ? 'border-red-500' : ''}`}
                />
                {touched.phoneNumber && errors.phoneNumber && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.phoneNumber}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Country
                </Label>
                <Select 
                  value={country} 
                  onValueChange={(value) => {
                    setCountry(value)
                    if (touched.country) handleBlur('country')
                  }}
                >
                  <SelectTrigger className={`bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20 h-11 ${touched.country && errors.country ? 'border-red-500' : ''}`}>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border/50 max-h-60">
                    {countries.map((countryName) => (
                      <SelectItem 
                        key={countryName} 
                        value={countryName}
                        className="hover:bg-accent/50 focus:bg-accent/50"
                      >
                        {countryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {touched.country && errors.country && (
                  <div className="flex items-center gap-1 mt-1 text-red-500 text-sm">
                    <AlertCircle className="h-3 w-3" />
                    <span>{errors.country}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleSignUp}
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium disabled:opacity-50"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create {userRole === "trainer" ? "Trainer" : "Client"} Account
                  </>
                )}
              </Button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  By creating an account, you agree to our{" "}
                  <button className="text-primary hover:text-primary/80 underline">
                    Terms of Service
                  </button>{" "}
                  and{" "}
                  <button className="text-primary hover:text-primary/80 underline">
                    Privacy Policy
                  </button>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-border/30">
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                  Sign in
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