"use client"

import type React from "react"

import { useFormStore } from "@/lib/form-store"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { GripVertical, Trash2, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function FieldList() {
  const { currentForm, selectedField, setSelectedField, deleteField, reorderFields } = useFormStore()
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  if (!currentForm) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Create or select a form to get started</p>
      </div>
    )
  }

  if (currentForm.fields.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No fields yet. Add your first field to begin.</p>
      </div>
    )
  }

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
      reorderFields(draggedIndex, dropIndex)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  return (
    <div className="space-y-2">
      {currentForm.fields.map((field, index) => (
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
            dragOverIndex === index && draggedIndex !== index && "border-primary border-2",
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
              <p className="text-xs text-muted-foreground">
                {field.type}
                {field.visibilityRules && field.visibilityRules.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    Conditional
                  </span>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                deleteField(field.id)
              }}
              className="h-8 w-8"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
