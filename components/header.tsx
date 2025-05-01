"use client"

import { useState } from "react"
import Link from "next/link"
import { useUser } from "@/contexts/user-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChevronDown, User, LogOut, Menu, X } from "lucide-react"

export default function Header() {
  const { user, logout } = useUser()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/auth/login")
  }

  const menuItems = [
    { label: "Documents", href: "/" },
    { label: "Annotations", href: "/annotations" },
    { label: "Templates", href: "/templates" },
    { label: "Help & Support", href: "/support" },
  ]

  return (
    <>
      {/* Announcement banner */}
      <div className="bg-[#8e7c3b] text-white py-2 px-4 text-center">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex-1"></div>
          <p className="flex-1 text-center text-sm">AutoDoc Premium now available at a special price.</p>
          <div className="flex-1 text-right">
            <Button variant="link" className="text-white text-sm p-0 h-auto">
              View plans and pricing
            </Button>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600">AutoDoc</span>
            </Link>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {menuItems.map((item) => (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 px-3">
                      {item.label} <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem>Option 1</DropdownMenuItem>
                    <DropdownMenuItem>Option 2</DropdownMenuItem>
                    <DropdownMenuItem>Option 3</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium hidden sm:inline">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer text-red-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={() => router.push("/auth/login")}>Sign in</Button>
            )}
          </div>
        </div>

        {/* Mobile navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <div className="container mx-auto py-4 px-4 space-y-2">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="block py-2 px-3 rounded-md hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
