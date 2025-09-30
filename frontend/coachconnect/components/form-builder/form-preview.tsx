"use client"

import type React from "react"

import { useFormStore } from "@/lib/form-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FormField } from "@/lib/types"
import { useState } from "react"

export function FormPreview() {
  const { currentForm } = useFormStore()
  const [formData, setFormData] = useState<Record<string, string>>({})

  if (!currentForm) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No form to preview</p>
      </div>
    )
  }

  const checkVisibility = (field: FormField): boolean => {
    if (!field.visibilityRules || field.visibilityRules.length === 0) return true

    return field.visibilityRules.every((rule) => {
      const fieldValue = formData[rule.fieldId] || ""
      switch (rule.condition) {
        case "equals":
          return fieldValue === rule.value
        case "notEquals":
          return fieldValue !== rule.value
        case "contains":
          return fieldValue.includes(rule.value)
        case "greaterThan":
          return Number(fieldValue) > Number(rule.value)
        case "lessThan":
          return Number(fieldValue) < Number(rule.value)
        default:
          return true
      }
    })
  }

  const renderField = (field: FormField) => {
    if (!checkVisibility(field)) return null

    const commonProps = {
      id: field.id,
      placeholder: field.placeholder,
      required: field.required,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setFormData({ ...formData, [field.id]: e.target.value }),
    }

    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "date":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input {...commonProps} type={field.type} />
          </div>
        )

      case "textarea":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea {...commonProps} />
          </div>
        )

      case "select":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "radio":
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}>
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )

      case "checkbox":
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="space-y-2">
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`} className="font-normal">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )

      case "file":
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input type="file" id={field.id} />
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">{currentForm.name}</CardTitle>
        {currentForm.description && <CardDescription>{currentForm.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          {currentForm.fields.map(renderField)}
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
