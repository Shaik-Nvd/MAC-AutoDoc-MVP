"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Upload, Search, FileText, Plus, Filter } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useUser } from "@/contexts/user-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface PDFDocument {
  id: string
  title: string
  url: string
  thumbnail: string
  uploadDate: Date
  size: number
  userId: string
}

interface PDFLibraryProps {
  onSelectPdf: (pdfUrl: string) => void
}

export default function PDFLibrary({ onSelectPdf }: PDFLibraryProps) {
  const { user } = useUser()
  const [documents, setDocuments] = useState<PDFDocument[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Load user's documents on mount
  useEffect(() => {
    if (user) {
      // In a real app, this would fetch from your backend
      const savedDocs = localStorage.getItem(`pdf_documents_${user.id}`)
      if (savedDocs) {
        try {
          const parsedDocs = JSON.parse(savedDocs)
          // Convert string dates back to Date objects
          const docsWithDates = parsedDocs.map((doc: any) => ({
            ...doc,
            uploadDate: new Date(doc.uploadDate),
          }))
          setDocuments(docsWithDates)
        } catch (error) {
          console.error("Failed to parse saved documents:", error)
        }
      } else {
        // Add sample documents for new users
        const sampleDocs = [
          {
            id: "1",
            title: "Sample Document 1",
            url: "/sample.pdf",
            thumbnail: "/pdf-icon-stack.png",
            uploadDate: new Date(2023, 5, 15),
            size: 1200000,
            userId: user.id,
          },
          {
            id: "2",
            title: "Sample Document 2",
            url: "/sample2.pdf",
            thumbnail: "/pdf-icon-stack.png",
            uploadDate: new Date(2023, 6, 22),
            size: 2500000,
            userId: user.id,
          },
        ]
        setDocuments(sampleDocs)
        localStorage.setItem(`pdf_documents_${user.id}`, JSON.stringify(sampleDocs))
      }
    }
  }, [user])

  // Save documents when they change
  useEffect(() => {
    if (user && documents.length > 0) {
      localStorage.setItem(`pdf_documents_${user.id}`, JSON.stringify(documents))
    }
  }, [documents, user])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !user) return

    const file = files[0]

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit")
      return
    }

    // Check if it's a PDF
    if (file.type !== "application/pdf") {
      alert("Only PDF files are supported")
      return
    }

    setIsUploading(true)

    // In a real app, you would upload the file to a server here
    // For this demo, we'll simulate a delay and add it to our local state
    setTimeout(() => {
      const newDoc: PDFDocument = {
        id: Date.now().toString(),
        title: file.name,
        url: URL.createObjectURL(file),
        thumbnail: "/pdf-icon-stack.png",
        uploadDate: new Date(),
        size: file.size,
        userId: user.id,
      }

      setDocuments([newDoc, ...documents])
      setIsUploading(false)
    }, 1500)
  }

  const filteredDocuments = documents.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  // Filter documents based on active tab
  const getFilteredDocs = () => {
    if (activeTab === "all") return filteredDocuments

    const now = new Date()
    if (activeTab === "recent") {
      // Last 7 days
      const sevenDaysAgo = new Date(now)
      sevenDaysAgo.setDate(now.getDate() - 7)
      return filteredDocuments.filter((doc) => doc.uploadDate >= sevenDaysAgo)
    }

    if (activeTab === "month") {
      // Last 30 days
      const thirtyDaysAgo = new Date(now)
      thirtyDaysAgo.setDate(now.getDate() - 30)
      return filteredDocuments.filter((doc) => doc.uploadDate >= thirtyDaysAgo)
    }

    return filteredDocuments
  }

  const displayDocuments = getFilteredDocs()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search documents..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={handleUploadClick} disabled={isUploading} className="bg-blue-600 hover:bg-blue-700">
            {isUploading ? "Uploading..." : "Upload PDF"}
            <Upload className="ml-2 h-4 w-4" />
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleFileChange} />
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Documents</TabsTrigger>
          <TabsTrigger value="recent">Recent (7 days)</TabsTrigger>
          <TabsTrigger value="month">Last 30 days</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          {renderDocumentGrid(displayDocuments)}
        </TabsContent>
        <TabsContent value="recent" className="mt-0">
          {renderDocumentGrid(displayDocuments)}
        </TabsContent>
        <TabsContent value="month" className="mt-0">
          {renderDocumentGrid(displayDocuments)}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderDocumentGrid(docs: PDFDocument[]) {
    if (docs.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium">No documents found</h3>
          <p className="text-sm text-gray-500">
            {searchQuery ? "Try a different search term" : "Upload a PDF to get started"}
          </p>
          <Button variant="outline" className="mt-4" onClick={handleUploadClick}>
            <Plus className="mr-2 h-4 w-4" /> Add PDF
          </Button>
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {docs.map((doc) => (
          <Card key={doc.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div
              className="aspect-[3/4] cursor-pointer bg-gray-50 flex items-center justify-center"
              onClick={() => onSelectPdf(doc.url)}
            >
              <img
                src={doc.thumbnail || "/placeholder.svg"}
                alt={doc.title}
                className="h-full w-full object-contain p-4"
              />
            </div>
            <CardContent className="p-4">
              <div className="mb-1 font-medium line-clamp-1" title={doc.title}>
                {doc.title}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDistanceToNow(doc.uploadDate, { addSuffix: true })}</span>
                <span>{formatFileSize(doc.size)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}
