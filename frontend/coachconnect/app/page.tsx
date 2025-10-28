"use client"
import { FieldList } from "@/components/form-builder/field-list"
import { FieldConfig } from "@/components/form-builder/field-config"
import { FormPreview } from "@/components/form-builder/form-preview"
import { AddFieldDialog } from "@/components/form-builder/add-field-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useFormStore } from "@/lib/form-store"
import { useUser } from "@/lib/user-context"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Save, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function FormBuilderPage() {
  const { currentForm, createNewForm, saveForm } = useFormStore()
  const { isLoggedIn, isClient, isTrainer } = useUser()
  const { toast } = useToast()
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)

  const handleSaveForm = async () => {
    if (!currentForm) return

    setIsSaving(true)
    try {
      // Save to local store first
      saveForm()

      // Send to backend via Next.js API route
      const response = await fetch("/api/form-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save form")
      }

      toast({
        title: "Form saved successfully",
        description: "Your form has been saved to the database.",
      })
    } catch (error) {
      console.error("[v0] Error saving form:", error)
      toast({
        title: "Error saving form",
        description: error instanceof Error ? error.message : "Failed to save form to database",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  useEffect(() => {
    // If user is logged in and is a client, redirect to dashboard
    if (isLoggedIn() && isClient()) {
      router.push("/dashboard")
      return
    }

    // If user is logged in as trainer, show form builder
    if (isLoggedIn() && isTrainer() && !currentForm) {
      createNewForm("Untitled Form", "Start building your form")
    }
  }, [isLoggedIn, isClient, isTrainer, currentForm, createNewForm, router])

  // Don't render anything while redirecting clients
  if (isLoggedIn() && isClient()) {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Form Builder</h2>
            {currentForm && (
              <p className="text-sm text-muted-foreground mt-1">{currentForm.name}</p>
            )}
          </div>
          {currentForm && (
            <Button 
              onClick={handleSaveForm} 
              disabled={isSaving} 
              className="bg-primary hover:bg-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Form
                </>
              )}
            </Button>
          )}
        </div>
        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-card border-border">
            <TabsTrigger value="builder" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">Builder</TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1 bg-card/50 border-border/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="text-foreground">Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <AddFieldDialog />
                  <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <FieldList />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-card/50 border-border/50 backdrop-blur-sm">
                <CardHeader className="border-b border-border/30">
                  <CardTitle className="text-foreground">Field Configuration</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                    <FieldConfig />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="preview">
            <div className="py-8">
              <FormPreview />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
