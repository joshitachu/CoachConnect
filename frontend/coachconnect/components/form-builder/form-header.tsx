"use client"

import { useFormStore } from "@/lib/form-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, FileText } from "lucide-react"
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

export function FormHeader() {
  const { currentForm, saveForm, createNewForm } = useFormStore()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleCreate = () => {
    if (!name.trim()) return
    createNewForm(name.trim(), description.trim())
    setName("")
    setDescription("")
    setOpen(false)
  }

  return (
    <div className="border-b bg-card">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-balance">Form Builder</h1>
              {currentForm && <p className="text-sm text-muted-foreground">{currentForm.name}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={open} onOpenChange={setOpen}>
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
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreate}>Create</Button>
                </div>
              </DialogContent>
            </Dialog>
            {currentForm && (
              <Button onClick={saveForm}>
                <Save className="h-4 w-4 mr-2" />
                Save Form
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
