"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Upload,
  Search,
  FileText,
  Plus,
  Filter,
  Clock,
  Calendar,
  Grid,
  List,
  SortAsc,
  SortDesc,
  X,
  Loader2,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useUser } from "@/contexts/user-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

interface PDFDocument {
  id: string
  title: string
  url: string
  thumbnail: string
  uploadDate: Date
  size: number
  userId: string
  tags?: string[]
  lastOpened?: Date
}

interface EnhancedPDFLibraryProps {
  onSelectPdf: (pdfUrl: string) => void
}

export default function EnhancedPDFLibrary({ onSelectPdf }: EnhancedPDFLibraryProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<PDFDocument[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [isDragging, setIsDragging] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const dropzoneRef = useRef<HTMLDivElement>(null)

  // Available tags
  const availableTags = ["Important", "Work", "Personal", "Research", "Archive"]

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
            lastOpened: doc.lastOpened ? new Date(doc.lastOpened) : undefined,
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
            title: "Annual Report 2023",
            url: "/sample.pdf",
            thumbnail: "/pdf-icon-stack.png",
            uploadDate: new Date(2023, 5, 15),
            lastOpened: new Date(2023, 6, 20),
            size: 1200000,
            userId: user.id,
            tags: ["Work", "Important"],
          },
          {
            id: "2",
            title: "Research Paper - AI Innovations",
            url: "/sample2.pdf",
            thumbnail: "/pdf-icon-stack.png",
            uploadDate: new Date(2023, 6, 22),
            lastOpened: new Date(2023, 6, 25),
            size: 2500000,
            userId: user.id,
            tags: ["Research"],
          },
          {
            id: "3",
            title: "Project Proposal",
            url: "/sample.pdf",
            thumbnail: "/pdf-icon-stack.png",
            uploadDate: new Date(2023, 7, 5),
            size: 1800000,
            userId: user.id,
            tags: ["Work"],
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

    handleFileUpload(files)
  }

  const handleFileUpload = async (files: FileList) => {
    const file = files[0]

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      })
      return
    }

    // Check if it's a PDF
    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Only PDF files are supported",
        variant: "destructive",
      })
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
        tags: [],
      }

      setDocuments([newDoc, ...documents])
      setIsUploading(false)

      toast({
        title: "Upload successful",
        description: `${file.name} has been added to your library`,
      })
    }, 1500)
  }

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only set dragging to false if we're leaving the dropzone itself
    if (e.currentTarget === dropzoneRef.current) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  // Filter and sort documents
  const getFilteredAndSortedDocs = useCallback(() => {
    let filtered = [...documents]

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((doc) => doc.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((doc) => doc.tags?.some((tag) => selectedTags.includes(tag)))
    }

    // Filter by tab
    if (activeTab === "recent") {
      // Last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      filtered = filtered.filter((doc) => doc.uploadDate >= sevenDaysAgo)
    } else if (activeTab === "month") {
      // Last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      filtered = filtered.filter((doc) => doc.uploadDate >= thirtyDaysAgo)
    }

    // Sort documents
    filtered.sort((a, b) => {
      let comparison = 0

      if (sortBy === "date") {
        comparison = a.uploadDate.getTime() - b.uploadDate.getTime()
      } else if (sortBy === "name") {
        comparison = a.title.localeCompare(b.title)
      } else if (sortBy === "size") {
        comparison = a.size - b.size
      }

      return sortDirection === "asc" ? comparison : -comparison
    })

    return filtered
  }, [documents, searchQuery, activeTab, sortBy, sortDirection, selectedTags])

  const filteredDocuments = getFilteredAndSortedDocs()

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B"
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / (1024 * 1024)).toFixed(1) + " MB"
  }

  const handleSelectPdf = (pdfUrl: string, docId: string) => {
    // Update last opened date
    setDocuments((docs) => docs.map((doc) => (doc.id === docId ? { ...doc, lastOpened: new Date() } : doc)))

    onSelectPdf(pdfUrl)
  }

  const toggleTag = (docId: string, tag: string) => {
    setDocuments((docs) =>
      docs.map((doc) => {
        if (doc.id === docId) {
          const currentTags = doc.tags || []
          const newTags = currentTags.includes(tag) ? currentTags.filter((t) => t !== tag) : [...currentTags, tag]

          return { ...doc, tags: newTags }
        }
        return doc
      }),
    )
  }

  const toggleSortDirection = () => {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
  }

  const toggleSelectedTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Sort by</p>
                <div className="flex flex-col gap-1">
                  <Button
                    variant={sortBy === "date" ? "default" : "ghost"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setSortBy("date")}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Date
                  </Button>
                  <Button
                    variant={sortBy === "name" ? "default" : "ghost"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setSortBy("name")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Name
                  </Button>
                  <Button
                    variant={sortBy === "size" ? "default" : "ghost"}
                    size="sm"
                    className="justify-start"
                    onClick={() => setSortBy("size")}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Size
                  </Button>
                </div>

                <div className="flex justify-between items-center mt-3">
                  <p className="text-sm font-medium">Direction</p>
                  <Button variant="outline" size="icon" onClick={toggleSortDirection}>
                    {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Filter by tags</p>
                  <div className="flex flex-wrap gap-1">
                    {availableTags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={selectedTags.includes(tag) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSelectedTag(tag)}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {selectedTags.length > 0 && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setSelectedTags([])}>
                    <X className="h-3 w-3 mr-1" /> Clear filters
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="hidden sm:flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
              className="rounded-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
              className="rounded-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          <Button
            onClick={handleUploadClick}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 button-hover"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
              </>
            ) : (
              <>
                Upload PDF
                <Upload className="ml-2 h-4 w-4" />
              </>
            )}
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
          {renderDocumentGrid(filteredDocuments)}
        </TabsContent>
        <TabsContent value="recent" className="mt-0">
          {renderDocumentGrid(filteredDocuments)}
        </TabsContent>
        <TabsContent value="month" className="mt-0">
          {renderDocumentGrid(filteredDocuments)}
        </TabsContent>
      </Tabs>
    </div>
  )

  function renderDocumentGrid(docs: PDFDocument[]) {
    if (docs.length === 0) {
      return (
        <div
          ref={dropzoneRef}
          className={`dropzone ${isDragging ? "active animate-pulse-once" : ""}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <FileText className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium">No documents found</h3>
          <p className="text-sm text-gray-500 mb-4">
            {searchQuery || selectedTags.length > 0
              ? "Try a different search term or filter"
              : "Upload a PDF to get started"}
          </p>
          <Button variant="outline" className="mt-2" onClick={handleUploadClick}>
            <Plus className="mr-2 h-4 w-4" /> Add PDF
          </Button>
          <p className="mt-4 text-sm text-gray-500">or drag and drop files here</p>
        </div>
      )
    }

    if (viewMode === "list") {
      return (
        <div
          className="space-y-2 animate-fade-in"
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-blue-50/80 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-blue-500" />
                <p className="mt-2 text-lg font-medium text-blue-700">Drop your PDF here</p>
              </div>
            </div>
          )}

          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center border rounded-lg p-3 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer"
              onClick={() => handleSelectPdf(doc.url, doc.id)}
            >
              <div className="h-12 w-12 flex-shrink-0 mr-4">
                <img
                  src={doc.thumbnail || "/placeholder.svg"}
                  alt={doc.title}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="flex-grow min-w-0">
                <div className="font-medium line-clamp-1" title={doc.title}>
                  {doc.title}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>{formatDistanceToNow(doc.uploadDate, { addSuffix: true })}</span>
                  <span className="mx-2">•</span>
                  <span>{formatFileSize(doc.size)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 ml-2">
                {doc.tags?.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="12" cy="5" r="1" />
                      <circle cx="12" cy="19" r="1" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Rename</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Download</DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => e.stopPropagation()}>Share</DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDocuments((docs) => docs.filter((d) => d.id !== doc.id))
                      toast({
                        title: "Document deleted",
                        description: `${doc.title} has been removed from your library`,
                      })
                    }}
                  >
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-fade-in"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-blue-50/80 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-blue-500" />
              <p className="mt-2 text-lg font-medium text-blue-700">Drop your PDF here</p>
            </div>
          </div>
        )}

        {docs.map((doc) => (
          <Card key={doc.id} className="overflow-hidden card-hover">
            <div
              className="aspect-[3/4] cursor-pointer bg-gray-50 flex items-center justify-center relative group"
              onClick={() => handleSelectPdf(doc.url, doc.id)}
            >
              <img
                src={doc.thumbnail || "/placeholder.svg"}
                alt={doc.title}
                className="h-full w-full object-contain p-4"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button variant="secondary" size="sm" className="shadow-lg">
                  Open PDF
                </Button>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="mb-1 font-medium line-clamp-1" title={doc.title}>
                {doc.title}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDistanceToNow(doc.uploadDate, { addSuffix: true })}</span>
                <span>{formatFileSize(doc.size)}</span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={doc.tags?.includes(tag) ? "default" : "outline"}
                    className="text-xs cursor-pointer opacity-70 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleTag(doc.id, tag)
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
}
