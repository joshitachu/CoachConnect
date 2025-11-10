import { DynamicForm } from "@/components/dynamic-form"
import {FormMetaSection} from "@/components/form-meta-section"

export default function Home() {
  return (
    <main className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* ✅ In-form meta section (title, description, save) */}
        <FormMetaSection />

        {/* ✅ Actual form fields */}
        <DynamicForm />
      </div>
    </main>
  )
}
