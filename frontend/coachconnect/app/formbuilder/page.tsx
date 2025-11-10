"use client"

import { FieldList } from "@/components/form-builder/field-list"
import { FieldConfig } from "@/components/form-builder/field-config"
import { FormPreview } from "@/components/form-builder/form-preview"
import { AddFieldDialog } from "@/components/form-builder/add-field-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFormStore } from "@/lib/form-store"
import { useUser } from "@/lib/user-context"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

// ✅ new meta section that replaces the header UX
import { FormMetaSection } from "@/components/form-meta-section"

export default function FormBuilderPage() {
  const { currentForm, createNewForm } = useFormStore()
  const { isLoggedIn, isClient, isTrainer } = useUser()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // If user is logged in and is a client, redirect to dashboard
    if (isLoggedIn() && isClient()) {
      router.push("/dashboard")
      return
    }

    // If user is logged in as trainer, show form builder
    if (isLoggedIn() && isTrainer() && !currentForm) {
      createNewForm("Untitled Form", "Start building your form")
      toast({ title: "New form", description: "You can start editing the title and description above." })
    }
  }, [isLoggedIn, isClient, isTrainer, currentForm, createNewForm, router, toast])

  // Don't render anything while redirecting clients
  if (isLoggedIn() && isClient()) {
    return null
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="container mx-auto px-6 py-8 space-y-6">
          <div className="p-4 sm:p-6">
            <FormMetaSection stickyActions />
        </div>

        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-card border-border">
            <TabsTrigger value="builder" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary-foreground">
              Preview
            </TabsTrigger>
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
