"use client"

import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { FormHeader } from "./app-header"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  
  // Don't show sidebar/headers on login and signup pages
  const isAuthPage = pathname === "/login" || pathname === "/signup" || pathname === "/onboarding/trainer"|| pathname === "/onboarding/client"|| pathname === "/select-trainer"
  
  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <FormHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
