"use client"

import { useState } from "react"
import { useUser } from "@/contexts/user-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "next/navigation"
import ProtectedRoute from "@/components/protected-route"
import { ArrowLeft } from "lucide-react"

export default function ProfilePage() {
  const { user } = useUser()
  const router = useRouter()

  // In a real app, these would update the user profile
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")

  const handleSave = () => {
    alert("Profile updated! (In a real app, this would save to the database)")
  }

  return (
    <ProtectedRoute>
      <div className="container py-8">
        <Button variant="ghost" className="mb-6" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Library
        </Button>

        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                  <AvatarFallback className="text-2xl">{user?.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl">Your Profile</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Account type: <span className="font-medium capitalize">{user?.role}</span>
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleSave}>
                Save Changes
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
