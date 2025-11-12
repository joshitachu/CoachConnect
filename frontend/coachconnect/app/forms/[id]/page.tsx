"use client"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useUser } from "@/lib/user-context"
import { GripVertical, Trash2, Plus, X, Save, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FormField, FieldType } from "@/lib/types"

interface Form {
  id: string
  name: string
  description: string
  fields: FormField[]
  createdAt: string
  updatedAt: string
  userEmail?: string
}

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "radio", label: "Radio" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
  { value: "file", label: "File" },
]

export default function FormEditPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const { id } = params
  
  const [form, setForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  
  // Add field dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState("")
  const [newFieldType, setNewFieldType] = useState<FieldType>("text")
  
  // Field config state
  const [newOption, setNewOption] = useState("")

  useEffect(() => {
    async function fetchForm() {
      if (!user?.email) {
        console.error("User not logged in.")
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/form-show?email=${encodeURIComponent(user.email)}`, {
          method: "GET"
        })
        
        if (!res.ok) {
          throw new Error("Failed to fetch forms")
        }

        const data = await res.json()
        
        if (data.form_schemas && Array.isArray(data.form_schemas)) {
          const foundForm = data.form_schemas.find((f: Form) => f.id === id)
          setForm(foundForm || null)
        } else {
          setForm(null)
        }
      } catch (error) {
        console.error("Error fetching form:", error)
        setForm(null)
      } finally {
        setLoading(false)
      }
    }

    if (id && user?.email) {
      fetchForm()
    }
  }, [id, user?.email])

  const handleSaveForm = async () => {
    if (!form || !user?.email) return

    setSaving(true)
    try {
      const res = await fetch("/api/formresave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          formSchema: form,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to save form")
      }

      alert("Form saved successfully!")
    } catch (error) {
      console.error("Error saving form:", error)
      alert("Failed to save form")
    } finally {
      setSaving(false)
    }
  }

  const handleAddField = () => {
    if (!newFieldLabel.trim() || !form) return

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: newFieldType,
      label: newFieldLabel.trim(),
      placeholder: "",
      required: false,
      options: ["select", "radio", "checkbox"].includes(newFieldType) ? ["Option 1", "Option 2"] : undefined,
      validation: [],
      visibilityRules: [],
    }

    setForm({
      ...form,
      fields: [...form.fields, newField],
    })
    
    setNewFieldLabel("")
    setNewFieldType("text")
    setAddDialogOpen(false)
  }

  const handleDeleteField = (fieldId: string) => {
    if (!form) return
    setForm({
      ...form,
      fields: form.fields.filter((f) => f.id !== fieldId),
    })
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  const handleUpdateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!form) return
    setForm({
      ...form,
      fields: form.fields.map((f) => f.id === fieldId ? { ...f, ...updates } : f),
    })
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const handleReorderFields = (fromIndex: number, toIndex: number) => {
    if (!form) return
    const newFields = [...form.fields]
    const [removed] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, removed)
    setForm({ ...form, fields: newFields })
  }

  const handleAddOption = () => {
    if (!newOption.trim() || !selectedField) return
    const options = [...(selectedField.options || []), newOption.trim()]
    handleUpdateField(selectedField.id, { options })
    setNewOption("")
  }

  const handleRemoveOption = (index: number) => {
    if (!selectedField) return
    const options = selectedField.options?.filter((_, i) => i !== index)
    handleUpdateField(selectedField.id, { options })
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      handleReorderFields(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <p className="text-center text-muted-foreground">Loading form...</p>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">Form not found.</p>
            <Button variant="outline" onClick={() => router.push("/forms")} className="w-full">
              Back to Forms
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const showOptions = selectedField && ["select", "radio", "checkbox"].includes(selectedField.type)

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/forms")}>
          ← Back to Forms
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push(`/forms/${id}`)}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSaveForm} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Form"}
          </Button>
        </div>
      </div>

      {/* Form Name and Description */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Form Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Field List */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Form Fields</h2>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Field
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Field</DialogTitle>
                  <DialogDescription>Create a new field for your form</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-label">Field Label</Label>
                    <Input
                      id="field-label"
                      placeholder="Enter field label"
                      value={newFieldLabel}
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddField()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-type">Field Type</Label>
                    <Select value={newFieldType} onValueChange={(value) => setNewFieldType(value as FieldType)}>
                      <SelectTrigger id="field-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((ft) => (
                          <SelectItem key={ft.value} value={ft.value}>
                            {ft.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddField}>Add Field</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {form.fields.length === 0 ? (
            <Card className="p-12">
              <p className="text-center text-muted-foreground">No fields yet. Add your first field to begin.</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {form.fields.map((field, index) => (
                <Card
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "p-4 cursor-pointer transition-all hover:border-primary/50",
                    selectedField?.id === field.id && "border-primary bg-accent/50",
                    draggedIndex === index && "opacity-50",
                    dragOverIndex === index && draggedIndex !== index && "border-primary border-2"
                  )}
                  onClick={() => setSelectedField(field)}
                >
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{field.label}</p>
                        {field.required && <span className="text-destructive text-xs">*</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">{field.type}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteField(field.id)
                      }}
                      className="h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Field Configuration */}
        <div>
          {!selectedField ? (
            <Card className="p-12">
              <p className="text-center text-muted-foreground text-sm">Select a field to configure</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="label">Label</Label>
                    <Input
                      id="label"
                      value={selectedField.label}
                      onChange={(e) => handleUpdateField(selectedField.id, { label: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="placeholder">Placeholder</Label>
                    <Input
                      id="placeholder"
                      value={selectedField.placeholder || ""}
                      onChange={(e) => handleUpdateField(selectedField.id, { placeholder: e.target.value })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="required">Required</Label>
                    <Switch
                      id="required"
                      checked={selectedField.required || false}
                      onCheckedChange={(checked) => handleUpdateField(selectedField.id, { required: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {showOptions && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {selectedField.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input value={option} readOnly className="flex-1" />
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add option"
                        value={newOption}
                        onChange={(e) => setNewOption(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAddOption()}
                      />
                      <Button onClick={handleAddOption} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}