import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Toaster  from "@/components/ui/toaster"
import { UserProvider } from "@/lib/user-context"
import { FormHeader } from "@/components/form-builder/form-header"
import Sidebar from "@/components/sidebar"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Form Builder",
  description: "Create dynamic forms with ease",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased bg-background text-foreground">
        <UserProvider>
          <FormHeader />
          <div className="flex">
            <Sidebar />
            <main className="flex-1">{children}</main>
          </div>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  )
}
