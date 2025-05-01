import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { UserProvider } from "@/contexts/user-context"
import { Toaster } from "@/components/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AutoDoc - PDF Annotation Tool",
  description: "A comprehensive PDF annotation tool with highlighting, comments, and more",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <UserProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            {children}
            <Toaster />
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  )
}
