"use client"

import { FormHeader } from "@/components/form-builder/form-header"
import { FieldList } from "@/components/form-builder/field-list"
import { FieldConfig } from "@/components/form-builder/field-config"
import { FormPreview } from "@/components/form-builder/form-preview"
import { AddFieldDialog } from "@/components/form-builder/add-field-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useFormStore } from "@/lib/form-store"
import { useEffect } from "react"

export default function FormBuilderPage() {
  const { currentForm, createNewForm } = useFormStore()

  useEffect(() => {
    if (!currentForm) {
      createNewForm("Untitled Form", "Start building your form")
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <FormHeader />
      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Fields</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AddFieldDialog />
                  <div className="max-h-[600px] overflow-y-auto pr-2">
                    <FieldList />
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Field Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto pr-2">
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
