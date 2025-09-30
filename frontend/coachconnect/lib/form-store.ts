"use client"

import { create } from "zustand"
import type { Form, FormField } from "./types"

type FormStore = {
  forms: Form[]
  currentForm: Form | null
  selectedField: FormField | null
  setCurrentForm: (form: Form | null) => void
  setSelectedField: (field: FormField | null) => void
  addField: (field: FormField) => void
  updateField: (fieldId: string, updates: Partial<FormField>) => void
  deleteField: (fieldId: string) => void
  reorderFields: (startIndex: number, endIndex: number) => void
  saveForm: () => void
  createNewForm: (name: string, description?: string) => void
}

export const useFormStore = create<FormStore>((set, get) => ({
  forms: [],
  currentForm: null,
  selectedField: null,

  setCurrentForm: (form) => set({ currentForm: form, selectedField: null }),

  setSelectedField: (field) => set({ selectedField: field }),

  addField: (field) =>
    set((state) => {
      if (!state.currentForm) return state
      return {
        currentForm: {
          ...state.currentForm,
          fields: [...state.currentForm.fields, field],
        },
      }
    }),

  updateField: (fieldId, updates) =>
    set((state) => {
      if (!state.currentForm) return state
      return {
        currentForm: {
          ...state.currentForm,
          fields: state.currentForm.fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)),
        },
        selectedField:
          state.selectedField?.id === fieldId ? { ...state.selectedField, ...updates } : state.selectedField,
      }
    }),

  deleteField: (fieldId) =>
    set((state) => {
      if (!state.currentForm) return state
      return {
        currentForm: {
          ...state.currentForm,
          fields: state.currentForm.fields.filter((field) => field.id !== fieldId),
        },
        selectedField: state.selectedField?.id === fieldId ? null : state.selectedField,
      }
    }),

  reorderFields: (startIndex, endIndex) =>
    set((state) => {
      if (!state.currentForm) return state
      const fields = [...state.currentForm.fields]
      const [removed] = fields.splice(startIndex, 1)
      fields.splice(endIndex, 0, removed)
      return {
        currentForm: {
          ...state.currentForm,
          fields,
        },
      }
    }),

  saveForm: () =>
    set((state) => {
      if (!state.currentForm) return state
      const updatedForm = {
        ...state.currentForm,
        updatedAt: new Date(),
      }
      const existingIndex = state.forms.findIndex((f) => f.id === updatedForm.id)
      const forms =
        existingIndex >= 0
          ? state.forms.map((f, i) => (i === existingIndex ? updatedForm : f))
          : [...state.forms, updatedForm]
      return { forms, currentForm: updatedForm }
    }),

  createNewForm: (name, description) =>
    set(() => {
      const newForm: Form = {
        id: `form-${Date.now()}`,
        name,
        description,
        fields: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      return { currentForm: newForm, selectedField: null }
    }),
}))
