"use client"

import { useFormStore } from "@/lib/form-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, FileText, Loader2, Pencil, User } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { useUser } from "@/lib/user-context"
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
  const { isLoggedIn } = useUser()
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
    <div className="border-b border-border/30 bg-card/50 backdrop-blur-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="h-6 w-6 text-primary drop-shadow-sm" />
            <div>
              <h1 className="text-2xl font-bold text-balance text-foreground drop-shadow-sm">Form Builder</h1>
              {currentForm && (
                <button
                  onClick={handleEdit}
                  className="text-sm text-muted-foreground hover:text-primary hover:drop-shadow-sm flex items-center gap-1 group transition-all duration-200"
                >
                  {currentForm.name}
                  <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isLoggedIn() && (
              <Link href="/login">
                <Button variant="outline" className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200">
                  <User className="h-4 w-4 mr-2" />
                  Login
                </Button>
              </Link>
            )}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200">New Form</Button>
              </DialogTrigger>
              <DialogContent className="bg-card border-border/50">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Create New Form</DialogTitle>
                  <DialogDescription className="text-muted-foreground">Start building a new form from scratch</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="form-name" className="text-foreground">Form Name</Label>
                    <Input
                      id="form-name"
                      placeholder="Enter form name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="form-description" className="text-foreground">Description (optional)</Label>
                    <Textarea
                      id="form-description"
                      placeholder="Enter form description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)} className="hover:bg-secondary/50">
                    Cancel
                  </Button>
                  <Button onClick={handleCreate} className="bg-primary hover:bg-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">Create</Button>
                </div>
              </DialogContent>
            </Dialog>

            {currentForm && (
              <>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogContent className="bg-card border-border/50">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">Edit Form Details</DialogTitle>
                      <DialogDescription className="text-muted-foreground">Update your form name and description</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-form-name" className="text-foreground">Form Name</Label>
                        <Input
                          id="edit-form-name"
                          placeholder="Enter form name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-form-description" className="text-foreground">Description (optional)</Label>
                        <Textarea
                          id="edit-form-description"
                          placeholder="Enter form description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="bg-input border-border/50 focus:border-primary/50 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setEditOpen(false)} className="hover:bg-secondary/50">
                        Cancel
                      </Button>
                      <Button onClick={handleUpdate} className="bg-primary hover:bg-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">Update</Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button onClick={handleSaveForm} disabled={isSaving} className="bg-primary hover:bg-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 disabled:opacity-50">
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
