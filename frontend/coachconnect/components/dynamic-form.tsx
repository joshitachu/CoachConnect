"use client"

import * as React from "react"
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
import { useUser } from "@/lib/user-context"

type FieldType =
  | "text" | "email" | "number" | "textarea" | "select" | "checkbox" | "radio"
  | "date" | "time" | "datetime-local" | "file" | "url" | "tel" | "password"
  | "range" | "color"

interface FormField {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  min?: number
  max?: number
  step?: number
  accept?: string
  validation: any[]
  visibilityRules: any[]
}

interface FormSchema {
  id: string
  name: string
  description: string
  fields?: FormField[]
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  form_schemas: FormSchema[]
}

export function DynamicForm() {
  const { user, getTrainerCode, markOnboardingComplete } = useUser()
  const [formData, setFormData] = useState<FormSchema | null>(null)
  const [loading, setLoading] = useState(true)
  const [formValues, setFormValues] = useState<Record<string, any>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch the trainer's form for this client
  useEffect(() => {
    let cancelled = false

    async function fetchForm() {
      const trainerCode = getTrainerCode()

      if (!trainerCode) {
        setError("Selecteer eerst een trainer om het juiste formulier te laden.")
        setFormData(null)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/form-show`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({ trainer_code: trainerCode }),
        })

        if (!response.ok) {
          if (response.status === 401) throw new Error("Log eerst in om dit formulier te bekijken.")
          const body = await response.json().catch(() => ({}))
          throw new Error(body?.detail || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data: ApiResponse = await response.json()

        if (!data.form_schemas || data.form_schemas.length === 0) {
          throw new Error("Geen formulieren gevonden voor deze trainer.")
        }

        const firstForm = data.form_schemas[0]
        const safeData: FormSchema = {
          id: firstForm?.id ?? "unknown",
          name: firstForm?.name ?? "Onboarding",
          description: firstForm?.description ?? "",
          fields: Array.isArray(firstForm?.fields) ? firstForm.fields : [],
          createdAt: firstForm?.createdAt ?? new Date().toISOString(),
          updatedAt: firstForm?.updatedAt ?? new Date().toISOString(),
        }

        if (!cancelled) {
          setFormData(safeData)
          setError(null)
        }
      } catch (err) {
        console.error("[DynamicForm] Error fetching form:", err)
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load form")
          setFormData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchForm()
    return () => { cancelled = true }
  }, [getTrainerCode])

  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleCheckboxArrayChange = (fieldId: string, option: string, checked: boolean) => {
    setFormValues((prev) => {
      const currentValues = prev[fieldId] || []
      return checked
        ? { ...prev, [fieldId]: [...currentValues, option] }
        : { ...prev, [fieldId]: currentValues.filter((v: string) => v !== option) }
    })
  }

  const handleSubmit = async () => {
    if (!formData) return
    setSubmitting(true)
    try {
      const trainerCode = getTrainerCode()
      if (!trainerCode) throw new Error("Geen trainer code beschikbaar.")

      // Voeg email toe aan payload
      const payload = {
        trainer_code: trainerCode,
        form_id: formData.id,
        values: formValues,
        email: user?.email || null, // Huidige gebruikers email
      }

      const res = await fetch("/api/form-submit-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.success) {
        throw new Error(data?.detail || "Kon formulier niet opslaan.")
      }

      // Flip flag locally and go to dashboard
      markOnboardingComplete()
      window.location.href = "/dashboard"
    } catch (e: any) {
      alert(e?.message || "Er ging iets mis bij het opslaan.")
    } finally {
      setSubmitting(false)
    }
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

  if (error) {
    return (
      <Card className="border-border shadow-lg">
        <CardContent className="py-12 text-center">
          <p className="text-destructive font-medium mb-2">Error loading form</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!formData) {
    return (
      <Card className="border-border shadow-lg">
        <CardContent className="py-12 text-center text-muted-foreground">No form data available</CardContent>
      </Card>
    )
  }

  const renderField = (field: FormField) => {
    const commonInputProps = {
      id: field.id,
      placeholder: field.placeholder || `Enter ${field.label}`,
      required: field.required,
      className: "w-full focus-visible:ring-ring",
    } as const

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
            min={field.min as number | undefined}
            max={field.max as number | undefined}
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
              value={[formValues[field.id] ?? field.min ?? 0]}
              onValueChange={(value) => handleInputChange(field.id, value[0])}
              className="w-full"
            />
            <div className="text-sm text-muted-foreground text-center">
              Value: {formValues[field.id] ?? field.min ?? 0}
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
        return Array.isArray(field.options) ? (
          <Select value={formValues[field.id] || ""} onValueChange={(value) => handleInputChange(field.id, value)}>
            <SelectTrigger id={field.id} className="w-full focus-visible:ring-ring">
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
        return Array.isArray(field.options) ? (
          <RadioGroup value={formValues[field.id] || ""} onValueChange={(value) => handleInputChange(field.id, value)}>
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
        if (Array.isArray(field.options) && field.options.length > 0) {
          return (
            <div className="space-y-3">
              {field.options.map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <Checkbox
                    id={`${field.id}-${option}`}
                    checked={(formValues[field.id] || []).includes(option)}
                    onCheckedChange={(checked) => handleCheckboxArrayChange(field.id, option, Boolean(checked))}
                  />
                  <Label htmlFor={`${field.id}-${option}`} className="font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          )
        }
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={Boolean(formValues[field.id])}
              onCheckedChange={(checked) => handleInputChange(field.id, Boolean(checked))}
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

  const fields: FormField[] = Array.isArray(formData?.fields) ? formData.fields : []

  return (
    <Card className="border-border shadow-lg">
      <CardHeader className="space-y-2">
        <CardTitle className="text-3xl font-bold text-foreground capitalize">{formData.name}</CardTitle>
        <CardDescription className="text-base text-muted-foreground">{formData.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields found for this form.</p>
          ) : (
            fields.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.type !== "checkbox" || (Array.isArray(field.options) && field.options.length > 0) ? (
                  <Label htmlFor={field.id} className="text-sm font-medium text-foreground capitalize">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                ) : null}
                {renderField(field)}
              </div>
            ))
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || fields.length === 0}
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
        </div>
      </CardContent>
    </Card>
  )
}