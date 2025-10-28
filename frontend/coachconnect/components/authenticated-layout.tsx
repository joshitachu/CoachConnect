"use client"

import { usePathname } from "next/navigation"
import { FormHeader } from "@/components/form-builder/form-header"
import Sidebar from "@/components/sidebar"
import { UserHeader } from "@/components/user-header"

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || ""
  
  // Don't show sidebar/headers on login and signup pages
  const isAuthPage = pathname === "/login" || pathname === "/signup"
  
  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <>
      <UserHeader />
      <FormHeader />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </>
  )
}
