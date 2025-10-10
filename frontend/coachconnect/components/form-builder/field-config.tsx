"use client"

import { useFormStore } from "@/lib/form-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import { useState } from "react"
import type { ValidationRule, VisibilityRule } from "@/lib/types"

export function FieldConfig() {
  const { selectedField, updateField, currentForm } = useFormStore()
  const [newOption, setNewOption] = useState("")

  if (!selectedField) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Select a field to configure</p>
      </div>
    )
  }

  const handleAddOption = () => {
    if (!newOption.trim()) return
    const options = [...(selectedField.options || []), newOption.trim()]
    updateField(selectedField.id, { options })
    setNewOption("")
  }

  const handleRemoveOption = (index: number) => {
    const options = selectedField.options?.filter((_, i) => i !== index)
    updateField(selectedField.id, { options })
  }

  const handleAddValidation = () => {
    const validation = [...(selectedField.validation || [])]
    validation.push({ type: "required", message: "This field is required" })
    updateField(selectedField.id, { validation })
  }

  const handleUpdateValidation = (index: number, updates: Partial<ValidationRule>) => {
    const validation = [...(selectedField.validation || [])]
    validation[index] = { ...validation[index], ...updates }
    updateField(selectedField.id, { validation })
  }

  const handleRemoveValidation = (index: number) => {
    const validation = selectedField.validation?.filter((_, i) => i !== index)
    updateField(selectedField.id, { validation })
  }

  const handleAddVisibilityRule = () => {
    const visibilityRules = [...(selectedField.visibilityRules || [])]
    const firstField = currentForm?.fields[0]
    if (firstField) {
      visibilityRules.push({
        fieldId: firstField.id,
        condition: "equals",
        value: "",
      })
      updateField(selectedField.id, { visibilityRules })
    }
  }

  const handleUpdateVisibilityRule = (index: number, updates: Partial<VisibilityRule>) => {
    const visibilityRules = [...(selectedField.visibilityRules || [])]
    visibilityRules[index] = { ...visibilityRules[index], ...updates }
    updateField(selectedField.id, { visibilityRules })
  }

  const handleRemoveVisibilityRule = (index: number) => {
    const visibilityRules = selectedField.visibilityRules?.filter((_, i) => i !== index)
    updateField(selectedField.id, { visibilityRules })
  }

  const showOptions = ["select", "radio", "checkbox"].includes(selectedField.type)

  return (
    <div className="space-y-6">
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
              onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="placeholder">Placeholder</Label>
            <Input
              id="placeholder"
              value={selectedField.placeholder || ""}
              onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="required">Required</Label>
            <Switch
              id="required"
              checked={selectedField.required || false}
              onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
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
  )
}
