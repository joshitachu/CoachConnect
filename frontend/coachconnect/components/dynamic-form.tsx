"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Loader2 } from "lucide-react"

/**
 * These TypeScript interfaces define the expected JSON structure.
 * The component will dynamically render ANY form that matches this structure,
 * regardless of the number of fields, field types, or options.
 */
interface FormField {
  id: string
  type:
    | "text"
    | "email"
    | "number"
    | "textarea"
    | "select"
    | "checkbox"
    | "radio"
    | "date"
    | "time"
    | "datetime-local"
    | "file"
    | "url"
    | "tel"
    | "password"
    | "range"
    | "color"
  label: string
  placeholder?: string
  required: boolean
  options?: string[] // For select, radio, or multiple checkboxes
  min?: number // For number, range, date, time
  max?: number // For number, range, date, time
  step?: number // For number, range
  accept?: string // For file input
  validation: any[]
  visibilityRules: any[]
}

interface FormData {
  id: string
  name: string
  description: string
  fields: FormField[]
  createdAt: string
  updatedAt: string
}

/**
 * DynamicForm Component
 *
 * This component is FULLY DYNAMIC and will render any form structure from your backend.
 * It automatically handles ALL common HTML input types and form field types.
 */
export function DynamicForm() {
  const [formData, setFormData] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function fetchForm() {
      try {
        const response = await fetch("/api/form-show")
        const data = await response.json()
        setFormData(data)
      } catch (error) {
        console.error("[v0] Error fetching form:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchForm()
  }, [])

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const handleCheckboxArrayChange = (fieldId: string, option: string, checked: boolean) => {
    setFormValues((prev) => {
      const currentValues = prev[fieldId] || []
      if (checked) {
        return { ...prev, [fieldId]: [...currentValues, option] }
      } else {
        return { ...prev, [fieldId]: currentValues.filter((v: string) => v !== option) }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    // TODO: Replace this with your actual form submission logic
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("[v0] Form submitted with values:", formValues)
    alert("Form submitted successfully!")
    setSubmitting(false)
  }

  if (loading) {
    return (
      <Card className="border-border shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (!formData) {
    return (
      <Card className="border-border shadow-lg">
        <CardContent className="py-12 text-center text-muted-foreground">Failed to load form data</CardContent>
      </Card>
    )
  }

  const renderField = (field: FormField) => {
    const commonInputProps = {
      id: field.id,
      placeholder: field.placeholder || `Enter ${field.label}`,
      required: field.required,
      className: "w-full focus-visible:ring-ring",
    }

    switch (field.type) {
      case "text":
      case "email":
      case "url":
      case "tel":
      case "password":
        return (
          <Input
            {...commonInputProps}
            type={field.type}
            value={formValues[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        )

      case "number":
        return (
          <Input
            {...commonInputProps}
            type="number"
            min={field.min}
            max={field.max}
            step={field.step}
            value={formValues[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        )

      case "date":
      case "time":
      case "datetime-local":
        return (
          <Input
            {...commonInputProps}
            type={field.type}
            min={field.min}
            max={field.max}
            value={formValues[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
          />
        )

      case "color":
        return (
          <div className="flex items-center gap-3">
            <Input
              {...commonInputProps}
              type="color"
              value={formValues[field.id] || "#000000"}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              className="w-20 h-10 cursor-pointer"
            />
            <span className="text-sm text-muted-foreground">{formValues[field.id] || "#000000"}</span>
          </div>
        )

      case "file":
        return (
          <Input
            {...commonInputProps}
            type="file"
            accept={field.accept}
            onChange={(e) => handleInputChange(field.id, e.target.files?.[0] || null)}
            className="cursor-pointer"
          />
        )

      case "range":
        return (
          <div className="space-y-2">
            <Slider
              id={field.id}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              value={[formValues[field.id] || field.min || 0]}
              onValueChange={(value) => handleInputChange(field.id, value[0])}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground text-center">
              Value: {formValues[field.id] || field.min || 0}
            </div>
          </div>
        )

      case "textarea":
        return (
          <Textarea
            id={field.id}
            placeholder={field.placeholder || `Enter ${field.label}`}
            required={field.required}
            value={formValues[field.id] || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            className="w-full min-h-[120px] focus-visible:ring-ring"
          />
        )

      case "select":
        return field.options ? (
          <Select
            value={formValues[field.id] || ""}
            onValueChange={(value) => handleInputChange(field.id, value)}
            required={field.required}
          >
            <SelectTrigger id={field.id} className="w-full focus:ring-ring">
              <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null

      case "radio":
        return field.options ? (
          <RadioGroup
            value={formValues[field.id] || ""}
            onValueChange={(value) => handleInputChange(field.id, value)}
            required={field.required}
          >
            {field.options.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`} className="font-normal cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : null

      case "checkbox":
        // If options exist, render multiple checkboxes
        if (field.options && field.options.length > 0) {
          return (
            <div className="space-y-3">
              {field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={(formValues[field.id] || []).includes(option)}
                    onCheckedChange={(checked) => handleCheckboxArrayChange(field.id, option, checked as boolean)}
                  />
                  <Label htmlFor={`${field.id}-${option}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )
        }
        // Single checkbox
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={formValues[field.id] || false}
              onCheckedChange={(checked) => handleInputChange(field.id, checked)}
              required={field.required}
            />
            <Label htmlFor={field.id} className="font-normal cursor-pointer">
              {field.placeholder || field.label}
            </Label>
          </div>
        )

      default:
        return <p className="text-sm text-muted-foreground">Unsupported field type: {field.type}</p>
    }
  }

  return (
    <Card className="border-border shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-bold text-foreground capitalize">{formData.name}</CardTitle>
        <CardDescription className="text-base text-muted-foreground">{formData.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {formData.fields.map((field) => (
            <div key={field.id} className="space-y-2">
              {field.type !== "checkbox" || (field.options && field.options.length > 0) ? (
                <Label htmlFor={field.id} className="text-sm font-medium text-foreground capitalize">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
              ) : null}
              {renderField(field)}
            </div>
          ))}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-6 text-base"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Form"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
