"use client"

import { useFormStore } from "@/lib/form-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, FileText, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
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
import { useUser } from "@/lib/user-context" // ⬅️ add this

type Props = {
  stickyActions?: boolean
}

export function FormMetaSection({ stickyActions = true }: Props) {
  const { currentForm, saveForm, createNewForm, updateFormMetadata } = useFormStore()
  const { toast } = useToast()
  const { user } = useUser() // ⬅️ get user from context
  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState(currentForm?.name ?? "")
  const [description, setDescription] = useState(currentForm?.description ?? "")
  const [isSaving, setIsSaving] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)

  // hydrate once when a form appears
  if (currentForm && name === "" && currentForm.name) {
    setName(currentForm.name)
    setDescription(currentForm.description ?? "")
  }

  const handleCreate = () => {
    if (!name.trim()) return
    createNewForm(name.trim(), description.trim())
    setCreateOpen(false)
    toast({ title: "New form created" })
  }

  const handleInlineUpdate = () => {
    if (!name.trim()) return
    updateFormMetadata(name.trim(), description.trim())
    toast({
      title: "Form updated",
      description: "Title and description saved.",
    })
    setIsEditingName(false)
  }

  const handleSaveForm = async () => {
    console.log("[save] entered, user:", user, "currentForm?", !!currentForm)
    if (!currentForm) {
      toast({ title: "No form to save", variant: "destructive" })
      return
    }
    if (!user?.email) {
      toast({
        title: "Missing user email",
        description: "Please log in again before saving.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)
    try {
      // Save locally first
      saveForm()

      // Send to backend via Next.js API route, INCLUDING userEmail
      const response = await fetch("/api/form-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentForm,
          name,
          description,
          userEmail: user.email, // ⬅️ send email
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error.error || "Failed to save form")
      }

      toast({
        title: "Form saved",
        description: "Your form has been saved to the database.",
      })
    } catch (error) {
      console.error("[form] Error saving form:", error)
      toast({
        title: "Error saving form",
        description:
          error instanceof Error ? error.message : "Failed to save form to database",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const disabledReason = isSaving ? "saving" : !currentForm ? "no currentForm" : !user?.email ? "no email" : ""

  return (
    <section aria-label="Form details" className="w-full">
      <div className="rounded-lg border bg-card p-3 sm:p-4 mb-4">
        <div className="flex items-start gap-2">
          <FileText className="mt-1 h-4 w-4 text-primary shrink-0" />
          <div className="w-full space-y-2">
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setIsEditingName(true)
              }}
              placeholder="Form title"
              aria-label="Form title"
              className="h-9"
            />

            <Textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                setIsEditingName(true)
              }}
              placeholder="Add a description (optional)"
              aria-label="Form description"
              className="min-h-[60px] resize-none"
              rows={2}
            />

            <div className="flex flex-wrap items-center gap-2">
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">New Form</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Form</DialogTitle>
                    <DialogDescription>Start from a blank form</DialogDescription>
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

              {isEditingName && (
                <Button variant="ghost" size="sm" onClick={handleInlineUpdate}>
                  Save details
                </Button>
              )}

              <Button
                onClick={handleSaveForm}
                disabled={isSaving || !currentForm || !user?.email} // ⬅️ also disable if no email
                size="sm"
                className="ml-auto"
                title={disabledReason}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-2" />
                    Save Form
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
