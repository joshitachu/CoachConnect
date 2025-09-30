export type FieldType = "text" | "email" | "number" | "textarea" | "select" | "radio" | "checkbox" | "date" | "file"

export type ValidationRule = {
  type: "required" | "minLength" | "maxLength" | "pattern" | "min" | "max"
  value?: string | number
  message: string
}

export type VisibilityRule = {
  fieldId: string
  condition: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan"
  value: string
}

export type FormField = {
  id: string
  type: FieldType
  label: string
  placeholder?: string
  required?: boolean
  options?: string[] // For select, radio, checkbox
  validation?: ValidationRule[]
  visibilityRules?: VisibilityRule[]
}

export type Form = {
  id: string
  name: string
  description?: string
  fields: FormField[]
  createdAt: Date
  updatedAt: Date
}
