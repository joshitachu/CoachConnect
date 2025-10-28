import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import Toaster  from "@/components/ui/toaster"
import { UserProvider } from "@/lib/user-context"
import AuthenticatedLayout from "@/components/authenticated-layout"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "CoachConnect",
  description: "Professional coaching platform for trainers and clients",
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
          <AuthenticatedLayout>
            {children}
          </AuthenticatedLayout>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  )
}
