"use client"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"

// Define the Form type based on your backend response
interface Form {
  id: string
  name: string
  description: string
  fields: any[]
  createdAt: string
  updatedAt: string
  userEmail?: string
}

export default function FormsListPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { user } = useUser()

  useEffect(() => {
    async function fetchForms() {
      if (!user?.email) {
        console.error("User not logged in.")
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/formshowfortrainer?email=${encodeURIComponent(user.email)}`, { 
          method: "GET" 
        })
        
        if (!res.ok) {
          throw new Error("Failed to fetch forms")
        }

        const data = await res.json()
        
        // Handle the backend response structure {form_schemas: [...]}
        if (data.form_schemas && Array.isArray(data.form_schemas)) {
          setForms(data.form_schemas)
        } else {
          setForms([])
        }
      } catch (err) {
        console.error("Error fetching forms:", err)
        setForms([])
      } finally {
        setLoading(false)
      }
    }

    fetchForms()
  }, [user?.email])

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Forms</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading forms...</p>
        </div>
      ) : forms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No forms found.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card
              key={form.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/forms/${form.id}`)}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-500 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">
                    {form.name || `Form #${form.id}`}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {form.description || "No description"}
                  </p>
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/forms/${form.id}`)
                    }}
                  >
                    View
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}