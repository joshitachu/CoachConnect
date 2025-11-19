// app/form/page.tsx
"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/lib/user-context'
import { Card, CardContent } from '@/components/ui/card'
import { DynamicForm } from '@/components/dynamic-form' // path = wherever you put the component

export default function FormPage() {
  const { user } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!user) return
    if (user.role !== 'client') router.replace('/dashboard')
    else if (!user.has_linked_trainer) router.replace('/trainer-onboarding') // or wherever you link trainers
    else if (user.has_completed_onboarding) router.replace('/dashboard')
  }, [user, router])

  if (!user || user.role !== 'client' || !user.has_linked_trainer || user.has_completed_onboarding) {
    return (
      <Card className="border-border shadow-lg">
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    )
  }

  return <DynamicForm />
}
