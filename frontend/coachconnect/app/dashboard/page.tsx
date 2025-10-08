"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserHeader } from "@/components/user-header"
import { useUser } from "@/lib/user-context"
import { User } from "lucide-react"

export default function ClientDashboard() {
  const { user } = useUser()

  return (
    <div className="min-h-screen bg-background relative">
      <UserHeader />
      
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-2xl mx-auto bg-card/50 border-border/50 backdrop-blur-sm shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-4xl font-bold text-foreground">
                Dashboard
              </CardTitle>
              {user && (
                <p className="text-lg text-muted-foreground mt-2">
                  Welcome back, {user.first_name}!
                </p>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <div className="p-6 bg-primary/5 rounded-lg border border-primary/20">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Client Portal
              </h3>
              <p className="text-muted-foreground">
                This is your personal dashboard where you can view assigned forms and track your progress.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="p-4 bg-card/30 rounded-lg border border-border/30">
                <h4 className="font-medium text-foreground mb-2">Assigned Forms</h4>
                <p className="text-sm text-muted-foreground">View forms assigned by your trainer</p>
              </div>
              
              <div className="p-4 bg-card/30 rounded-lg border border-border/30">
                <h4 className="font-medium text-foreground mb-2">Progress Tracking</h4>
                <p className="text-sm text-muted-foreground">Monitor your completion status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}