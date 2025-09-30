"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useFormStore } from "@/lib/form-store"
import type { FieldType, FormField } from "@/lib/types"

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

export function AddFieldDialog() {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState("")
  const [type, setType] = useState<FieldType>("text")
  const { addField } = useFormStore()

  const handleAdd = () => {
    if (!label.trim()) return

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type,
      label: label.trim(),
      placeholder: "",
      required: false,
      options: ["select", "radio", "checkbox"].includes(type) ? ["Option 1", "Option 2"] : undefined,
      validation: [],
      visibilityRules: [],
    }

    addField(newField)
    setLabel("")
    setType("text")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
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
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="field-type">Field Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as FieldType)}>
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Field</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
