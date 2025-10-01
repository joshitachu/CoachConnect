"use client"

import { useFormStore } from "@/lib/form-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, FileText, Loader2, Pencil } from "lucide-react"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export function FormHeader() {
  const { currentForm, saveForm, createNewForm, updateFormMetadata } = useFormStore()
  const { toast } = useToast()
  const [createOpen, setCreateOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleCreate = () => {
    if (!name.trim()) return
    createNewForm(name.trim(), description.trim())
    setName("")
    setDescription("")
    setCreateOpen(false)
  }

  const handleEdit = () => {
    if (!currentForm) return
    setName(currentForm.name)
    setDescription(currentForm.description || "")
    setEditOpen(true)
  }

  const handleUpdate = () => {
    if (!name.trim()) return
    updateFormMetadata(name.trim(), description.trim())
    setEditOpen(false)
    toast({
      title: "Form updated",
      description: "Form name and description have been updated.",
    })
  }

  const handleSaveForm = async () => {
    if (!currentForm) return

    setIsSaving(true)
    try {
      // Save to local store first
      saveForm()

      // Send to backend via Next.js API route
      const response = await fetch("/api/form-submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentForm),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to save form")
      }

      toast({
        title: "Form saved successfully",
        description: "Your form has been saved to the database.",
      })
    } catch (error) {
      console.error("[v0] Error saving form:", error)
      toast({
        title: "Error saving form",
        description: error instanceof Error ? error.message : "Failed to save form to database",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-balance">Form Builder</h1>
              {currentForm && (
                <button
                  onClick={handleEdit}
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 group"
                >
                  {currentForm.name}
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">New Form</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Form</DialogTitle>
                  <DialogDescription>Start building a new form from scratch</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="form-name">Form Name</Label>
                    <Input
                      id="form-name"
                      placeholder="Enter form name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="form-description">Description (optional)</Label>
                    <Textarea
                      id="form-description"
                      placeholder="Enter form description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>

            {currentForm && (
              <>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Form Details</DialogTitle>
                      <DialogDescription>Update your form name and description</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-form-name">Form Name</Label>
                        <Input
                          id="edit-form-name"
                          placeholder="Enter form name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-form-description">Description (optional)</Label>
                        <Textarea
                          id="edit-form-description"
                          placeholder="Enter form description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate}>Update</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button onClick={handleSaveForm} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Form
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
