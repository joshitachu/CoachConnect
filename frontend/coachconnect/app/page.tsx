"use client"

import { useEffect } from "react"
import { useFormStore } from "@/lib/form-store"
import { FieldList } from "@/components/form-builder/field-list"
import { FieldConfig } from "@/components/form-builder/field-config"
import { FormPreview } from "@/components/form-builder/form-preview"
import { AddFieldDialog } from "@/components/form-builder/add-field-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FileText, Settings, Eye } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function FormBuilder() {
  const { currentForm, setCurrentForm } = useFormStore()

  useEffect(() => {
    // Initialize with a sample form
    if (!currentForm) {
      setCurrentForm({
        id: "form-1",
        name: "Contact Form",
        description: "Get in touch with us",
        fields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }, [currentForm, setCurrentForm])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Form Builder</h1>
                <p className="text-xs text-muted-foreground">Create dynamic forms with ease</p>
              </div>
            </div>
            <Button>Save Form</Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Field List */}
          <Card className="lg:col-span-3 p-4">
            <div className="space-y-4">
              <div>
                <h2 className="font-semibold mb-2">Form Fields</h2>
                <p className="text-xs text-muted-foreground mb-4">Drag to reorder fields</p>
              </div>
              <AddFieldDialog />
              <Separator />
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                <FieldList />
              </div>
            </div>
          </Card>

          {/* Center - Preview */}
          <Card className="lg:col-span-5 p-6">
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="preview">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Form Settings
                </TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="mt-0">
                <div className="max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                  <FormPreview />
                </div>
              </TabsContent>
              <TabsContent value="settings" className="mt-0 space-y-4">
                <div>
                  <label className="text-sm font-medium">Form Name</label>
                  <Input
                    value={currentForm?.name || ""}
                    onChange={(e) => currentForm && setCurrentForm({ ...currentForm, name: e.target.value })}
                    placeholder="Enter form name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    value={currentForm?.description || ""}
                    onChange={(e) =>
                      currentForm &&
                      setCurrentForm({
                        ...currentForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter form description"
                    className="mt-1"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </Card>

          {/* Right Sidebar - Field Configuration */}
          <Card className="lg:col-span-4 p-4">
            <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              <FieldConfig />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
