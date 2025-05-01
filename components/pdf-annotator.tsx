"use client"

import type React from "react"
import type { Annotation, AnnotationFilter } from "@/types/annotations"

import { useEffect, useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Pencil,
  Highlighter,
  Eraser,
  Save,
  Search,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Trash2,
  Edit,
  X,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useUser } from "@/contexts/user-context"
import { useToast } from "@/hooks/use-toast"
import AnnotationFilterPanel from "./annotation-filter"
import ExportDialog from "./export-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Added more dark color options
const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#FFEB3B" },
  { name: "Green", value: "#4CAF50" },
  { name: "Blue", value: "#2196F3" },
  { name: "Pink", value: "#FF4081" },
  { name: "Orange", value: "#FF9800" },
  { name: "Purple", value: "#673AB7" },
  { name: "Dark Blue", value: "#1A237E" },
  { name: "Dark Green", value: "#1B5E20" },
  { name: "Dark Red", value: "#B71C1C" },
  { name: "Dark Purple", value: "#4A148C" },
  { name: "Dark Teal", value: "#004D40" },
]

// Added more dark color options for categories
const CATEGORIES = [
  { name: "Important", color: "#FF4081" },
  { name: "Question", color: "#2196F3" },
  { name: "Idea", color: "#4CAF50" },
  { name: "Todo", color: "#FF9800" },
  { name: "Issue", color: "#F44336" },
  { name: "Critical", color: "#B71C1C" },
  { name: "Reference", color: "#673AB7" },
  { name: "Research", color: "#004D40" },
]

interface PDFAnnotatorProps {
  pdfUrl: string
}

export default function PDFAnnotator({ pdfUrl }: PDFAnnotatorProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [originalCanvasSize, setOriginalCanvasSize] = useState({ width: 0, height: 0 })
  const [tool, setTool] = useState<"highlight" | "pen" | "comment" | "eraser" | "area-zoom">("highlight")
  const [highlightColor, setHighlightColor] = useState(HIGHLIGHT_COLORS[0].value)
  const [isDrawing, setIsDrawing] = useState(false)

  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [pdfDocument, setPdfDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeAnnotation, setActiveAnnotation] = useState<string | null>(null)
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [commentPosition, setCommentPosition] = useState<{ x: number; y: number } | null>(null)
  const [commentContent, setCommentContent] = useState("")
  const [commentCategory, setCommentCategory] = useState(CATEGORIES[0].name)
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null)
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [highlightStart, setHighlightStart] = useState<{ x: number; y: number } | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>("")

  // New state for advanced filtering
  const [filter, setFilter] = useState<AnnotationFilter>({})
  const [filteredAnnotations, setFilteredAnnotations] = useState<Annotation[]>([])
  const [pdfTextContent, setPdfTextContent] = useState<string[]>([])
  const [sidebarTab, setSidebarTab] = useState<"annotations" | "outline">("annotations")

  // Load user's annotations for this PDF
  useEffect(() => {
    if (user) {
      const savedAnnotations = localStorage.getItem(`pdf-annotations-${pdfUrl}-${user.id}`)
      if (savedAnnotations) {
        try {
          const parsedAnnotations = JSON.parse(savedAnnotations)
          // Convert string dates back to Date objects
          const annotationsWithDates = parsedAnnotations.map((annotation: any) => ({
            ...annotation,
            createdAt: new Date(annotation.createdAt),
          }))
          setAnnotations(annotationsWithDates)
        } catch (error) {
          console.error("Failed to parse saved annotations:", error)
        }
      }
    }
  }, [pdfUrl, user])

  // Simulating PDF.js functionality
  useEffect(() => {
    // In a real implementation, this would use PDF.js to load the document
    setLoading(true)

    // Simulate loading a PDF document
    setTimeout(() => {
      setPdfDocument({
        numPages: 5,
        getPage: (num: number) => ({
          getViewport: () => ({ width: 800, height: 1100 }),
          render: () => {},
        }),
      })
      setTotalPages(5)

      // Simulate extracting text content from PDF
      const simulatedTextContent = [
        "This is the text content of page 1. It contains information about PDF annotation tools and techniques.",
        "Page 2 discusses the benefits of digital document annotation and collaboration features.",
        "Page 3 covers advanced annotation techniques including highlighting, commenting, and drawing.",
        "Page 4 explains how to export annotations and share them with colleagues.",
        "Page 5 provides troubleshooting tips and best practices for PDF annotation.",
      ]
      setPdfTextContent(simulatedTextContent)

      setLoading(false)
    }, 1000)

    // Reset to first page when changing documents
    setCurrentPage(1)
  }, [pdfUrl])

  // Apply filters to annotations
  useEffect(() => {
    let filtered = [...annotations]

    // Filter by search query in annotation content
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase()
      filtered = filtered.filter(
        (annotation) =>
          (annotation.content && annotation.content.toLowerCase().includes(query)) ||
          // Also search in PDF text content if we're searching the current page
          (filter.page === currentPage && pdfTextContent[currentPage - 1]?.toLowerCase().includes(query)),
      )
    }

    // Filter by category
    if (filter.category) {
      filtered = filtered.filter((annotation) => annotation.category === filter.category)
    }

    // Filter by type
    if (filter.type) {
      filtered = filtered.filter((annotation) => annotation.type === filter.type)
    }

    // Filter by page
    if (filter.page !== undefined && filter.page !== null) {
      filtered = filtered.filter((annotation) => annotation.page === filter.page)
    }

    // Filter by date range
    if (filter.dateRange?.start || filter.dateRange?.end) {
      filtered = filtered.filter((annotation) => {
        const annotationDate = new Date(annotation.createdAt)
        const startDate = filter.dateRange?.start ? new Date(filter.dateRange.start) : null
        const endDate = filter.dateRange?.end ? new Date(filter.dateRange.end) : null

        if (startDate && endDate) {
          return annotationDate >= startDate && annotationDate <= endDate
        } else if (startDate) {
          return annotationDate >= startDate
        } else if (endDate) {
          return annotationDate <= endDate
        }

        return true
      })
    }

    setFilteredAnnotations(filtered)
  }, [annotations, filter, currentPage, pdfTextContent])

  // Render the current page - memoized to prevent unnecessary re-renders
  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current) return

    try {
      const page = await pdfDocument.getPage(currentPage)
      const viewport = page.getViewport({ scale: 1.0 }) // Get original size first

      const canvas = canvasRef.current
      if (!canvas) return

      const context = canvas.getContext("2d")
      if (!context) return

      // Store original size
      const originalWidth = viewport.width
      const originalHeight = viewport.height

      if (originalCanvasSize.width === 0) {
        setOriginalCanvasSize({ width: originalWidth, height: originalHeight })
      }

      // Apply scale to canvas dimensions
      const scaledWidth = originalWidth * scale
      const scaledHeight = originalHeight * scale

      // Set canvas dimensions
      canvas.width = scaledWidth
      canvas.height = scaledHeight

      // Clear the canvas first
      context.fillStyle = "#fff"
      context.fillRect(0, 0, scaledWidth, scaledHeight)

      // Apply scale transformation
      context.save()
      context.scale(scale, scale)

      // Draw PDF content (simulated)
      context.fillStyle = "#000"
      context.font = "24px Arial"
      context.fillText(`Page ${currentPage} of ${totalPages}`, 50, 50)

      // Draw some sample text lines
      context.font = "16px Arial"
      for (let i = 0; i < 20; i++) {
        context.fillText(`This is sample text line ${i + 1} on page ${currentPage}.`, 50, 100 + i * 30)
      }

      // Highlight search results in the PDF text if there's a search query
      if (filter.searchQuery && pdfTextContent[currentPage - 1]) {
        const query = filter.searchQuery.toLowerCase()
        const pageText = pdfTextContent[currentPage - 1]

        if (pageText.toLowerCase().includes(query)) {
          // This is a simplified approach - in a real implementation with PDF.js,
          // you would use the text layer coordinates to highlight the actual text
          context.fillStyle = "rgba(255, 255, 0, 0.3)"

          // Simulate highlighting the search term in the text
          // In a real implementation, you would get the actual text positions from PDF.js
          const lineHeight = 30
          for (let i = 0; i < 20; i++) {
            const lineText = `This is sample text line ${i + 1} on page ${currentPage}.`.toLowerCase()
            if (lineText.includes(query)) {
              context.fillRect(50, 85 + i * lineHeight, 700, 20)
            }
          }
        }
      }

      // Restore context to remove scaling for other operations
      context.restore()

      // Draw annotations with their own scaling
      drawAnnotations()
    } catch (error) {
      console.error("Error rendering PDF page:", error)
    }
  }, [pdfDocument, currentPage, scale, originalCanvasSize.width, totalPages, filter.searchQuery, pdfTextContent])

  // Effect to render the page when dependencies change
  useEffect(() => {
    renderPage()
  }, [renderPage, annotations, filteredAnnotations])

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext("2d")
    if (!context) return

    try {
      // Draw annotations for current page
      const pageAnnotations = annotations.filter((a) => a.page === currentPage)

      pageAnnotations.forEach((annotation) => {
        context.save() // Save context state

        if (annotation.type === "drawing" && annotation.points) {
          context.beginPath()
          context.strokeStyle = annotation.color
          context.lineWidth = 2 * scale

          annotation.points.forEach((point, index) => {
            const scaledX = point[0] * scale
            const scaledY = point[1] * scale

            if (index === 0) {
              context.moveTo(scaledX, scaledY)
            } else {
              context.lineTo(scaledX, scaledY)
            }
          })

          context.stroke()
        } else if (annotation.type === "highlight" && annotation.position) {
          const scaledX = annotation.position.x * scale
          const scaledY = annotation.position.y * scale
          const scaledWidth = (annotation.position.width || 0) * scale
          const scaledHeight = (annotation.position.height || 0) * scale

          context.fillStyle = annotation.color + "80" // Add transparency
          context.fillRect(scaledX, scaledY, scaledWidth, scaledHeight)
        } else if (annotation.type === "comment" && annotation.position) {
          const scaledX = annotation.position.x * scale
          const scaledY = annotation.position.y * scale
          const radius = 8 * scale

          // Draw comment indicator
          context.beginPath()
          context.fillStyle = annotation.color
          context.arc(scaledX, scaledY, radius, 0, 2 * Math.PI)
          context.fill()

          // Draw comment number or icon
          context.fillStyle = "#fff"
          context.font = `${10 * scale}px Arial`
          context.textAlign = "center"
          context.textBaseline = "middle"
          context.fillText("i", scaledX, scaledY)
        }

        context.restore() // Restore context state
      })
    } catch (error) {
      console.error("Error drawing annotations:", error)
    }
  }, [annotations, currentPage, scale])

  // Get canvas coordinates from mouse event
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    // Adjust coordinates based on scale
    const x = (e.clientX - rect.left) / scale
    const y = (e.clientY - rect.top) / scale

    return { x, y }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add annotations",
        variant: "destructive",
      })
      return
    }

    const { x, y } = getCanvasCoordinates(e)
    setDebugInfo(`Mouse down at: x=${x.toFixed(2)}, y=${y.toFixed(2)}, tool=${tool}`)

    if (tool === "area-zoom") {
      setIsSelecting(true)
      setSelectionStart({ x, y })
      setSelectionEnd({ x, y })
      return
    }

    if (tool === "highlight") {
      // Start highlighting
      setHighlightStart({ x, y })
    } else if (tool === "pen") {
      setIsDrawing(true)
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: "drawing",
        page: currentPage,
        color: highlightColor,
        position: { x, y },
        points: [[x, y]],
        createdAt: new Date(),
        userId: user.id,
      }

      setAnnotations([...annotations, newAnnotation])
    } else if (tool === "comment") {
      setCommentPosition({ x, y })
    } else if (tool === "eraser") {
      // Find annotations near the click point and remove them
      const annotationsToKeep = annotations.filter((annotation) => {
        if (annotation.page !== currentPage) return true

        // Only allow users to erase their own annotations
        if (annotation.userId !== user.id) return true

        if (annotation.type === "highlight" || annotation.type === "comment") {
          const { position } = annotation
          const distance = Math.sqrt(Math.pow(position.x - x, 2) + Math.pow(position.y - y, 2))
          return distance > 20 // Keep annotations more than 20px away
        }

        return true
      })

      if (annotationsToKeep.length < annotations.length) {
        setAnnotations(annotationsToKeep)
        toast({
          title: "Annotation removed",
          description: "The annotation has been erased",
        })
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e)

    if (isSelecting && tool === "area-zoom") {
      setSelectionEnd({ x, y })
      return
    }

    if (highlightStart && tool === "highlight") {
      setSelectionEnd({ x, y })
      return
    }

    if (!isDrawing || tool !== "pen") return

    const updatedAnnotations = [...annotations]
    const currentAnnotation = updatedAnnotations[updatedAnnotations.length - 1]

    if (currentAnnotation && currentAnnotation.type === "drawing" && currentAnnotation.points) {
      currentAnnotation.points.push([x, y])
      setAnnotations(updatedAnnotations)

      // Redraw
      const canvas = canvasRef.current
      if (!canvas) return

      const context = canvas.getContext("2d")
      if (!context) return

      context.beginPath()
      context.strokeStyle = currentAnnotation.color
      context.lineWidth = 2 * scale

      const points = currentAnnotation.points
      const lastTwoPoints = points.slice(-2)

      if (lastTwoPoints.length === 2) {
        context.moveTo(lastTwoPoints[0][0] * scale, lastTwoPoints[0][1] * scale)
        context.lineTo(lastTwoPoints[1][0] * scale, lastTwoPoints[1][1] * scale)
        context.stroke()
      }
    }
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!user) return

    if (isSelecting && tool === "area-zoom" && selectionStart && selectionEnd) {
      const width = Math.abs(selectionEnd.x - selectionStart.x)
      const height = Math.abs(selectionEnd.y - selectionStart.y)

      // Only zoom if the selection has a reasonable size
      if (width > 10 && height > 10) {
        zoomToArea(selectionStart, selectionEnd)
      }

      setIsSelecting(false)
      setSelectionStart(null)
      setSelectionEnd(null)
      return
    }

    if (highlightStart && tool === "highlight" && selectionEnd) {
      // Create highlight annotation
      const left = Math.min(highlightStart.x, selectionEnd.x)
      const top = Math.min(highlightStart.y, selectionEnd.y)
      const width = Math.abs(selectionEnd.x - highlightStart.x)
      const height = Math.abs(selectionEnd.y - highlightStart.y)

      // Only create highlight if it has a reasonable size
      if (width > 5 && height > 5) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: "highlight",
          page: currentPage,
          color: highlightColor,
          position: { x: left, y: top, width, height },
          category: filter.category || undefined,
          createdAt: new Date(),
          userId: user.id,
        }

        setAnnotations([...annotations, newAnnotation])
        toast({
          title: "Highlight added",
          description: "Your highlight has been added to the document",
        })
      }

      setHighlightStart(null)
      setSelectionEnd(null)
      return
    }

    setIsDrawing(false)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const handleSaveAnnotations = () => {
    if (!user) return

    const data = JSON.stringify(annotations)
    localStorage.setItem(`pdf-annotations-${pdfUrl}-${user.id}`, data)
    toast({
      title: "Annotations saved",
      description: "Your annotations have been saved successfully",
    })
  }

  const handleAddComment = () => {
    if (!commentPosition || !commentContent || !user) return

    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: "comment",
      page: currentPage,
      color: CATEGORIES.find((c) => c.name === commentCategory)?.color || CATEGORIES[0].color,
      position: commentPosition,
      content: commentContent,
      category: commentCategory,
      createdAt: new Date(),
      userId: user.id,
    }

    setAnnotations([...annotations, newAnnotation])
    setCommentPosition(null)
    setCommentContent("")
    toast({
      title: "Comment added",
      description: "Your comment has been added to the document",
    })
  }

  const handleCancelComment = () => {
    setCommentPosition(null)
    setCommentContent("")
  }

  const handleDeleteAnnotation = (id: string) => {
    if (!user) return

    // Only allow users to delete their own annotations
    const annotation = annotations.find((a) => a.id === id)
    if (annotation && annotation.userId !== user.id) {
      toast({
        title: "Permission denied",
        description: "You can only delete your own annotations",
        variant: "destructive",
      })
      return
    }

    setAnnotations(annotations.filter((a) => a.id !== id))
    setActiveAnnotation(null)
    toast({
      title: "Annotation deleted",
      description: "The annotation has been removed",
    })
  }

  const handleEditAnnotation = (id: string) => {
    if (!user) return

    const annotation = annotations.find((a) => a.id === id)

    // Only allow users to edit their own annotations
    if (annotation && annotation.userId !== user.id) {
      toast({
        title: "Permission denied",
        description: "You can only edit your own annotations",
        variant: "destructive",
      })
      return
    }

    if (annotation) {
      setEditingAnnotation(id)
      setEditContent(annotation.content || "")
    }
  }

  const handleSaveEdit = (id: string) => {
    setAnnotations(annotations.map((a) => (a.id === id ? { ...a, content: editContent } : a)))
    setEditingAnnotation(null)
    toast({
      title: "Annotation updated",
      description: "Your changes have been saved",
    })
  }

  // Completely rewritten zoom handlers to prevent browser zoom
  const handleZoomIn = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setScale((prev) => Math.min(5.0, prev + 0.2))
  }

  const handleZoomOut = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setScale((prev) => Math.max(0.5, prev - 0.2))
  }

  const handleResetZoom = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setScale(1.0)
  }

  // Prevent wheel zoom from affecting the whole page
  const handleWheel = useCallback((e: React.WheelEvent | WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      e.stopPropagation()

      const delta = e.deltaY * -0.01
      setScale((prev) => Math.max(0.5, Math.min(5.0, prev + delta)))
      return false
    }
  }, [])

  // Add event listeners for wheel events to prevent browser zoom
  useEffect(() => {
    const canvasContainer = canvasContainerRef.current
    if (!canvasContainer) return

    // Add passive: false to override browser defaults
    canvasContainer.addEventListener("wheel", handleWheel as any, { passive: false })

    // Prevent browser zoom shortcuts
    const preventZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "-" || e.key === "=")) {
        e.preventDefault()

        if (e.key === "+" || e.key === "=") {
          setScale((prev) => Math.min(5.0, prev + 0.2))
        } else if (e.key === "-") {
          setScale((prev) => Math.max(0.5, prev - 0.2))
        }
      }
    }

    window.addEventListener("keydown", preventZoom)

    return () => {
      canvasContainer.removeEventListener("wheel", handleWheel as any)
      window.removeEventListener("keydown", preventZoom)
    }
  }, [handleWheel])

  // Get page annotations
  const pageAnnotations = filteredAnnotations.filter((a) => a.page === currentPage)

  const zoomToArea = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    if (!canvasRef.current || !canvasContainerRef.current) return

    const canvas = canvasRef.current
    const container = canvasContainerRef.current

    // Calculate the selection rectangle
    const selectionWidth = Math.abs(end.x - start.x)
    const selectionHeight = Math.abs(end.y - start.y)

    // Calculate the center of the selection
    const centerX = Math.min(start.x, end.x) + selectionWidth / 2
    const centerY = Math.min(start.y, end.y) + selectionHeight / 2

    // Calculate the appropriate zoom level
    const containerWidth = container.clientWidth - 40 // Adjust for padding
    const containerHeight = container.clientHeight - 40

    const widthRatio = containerWidth / selectionWidth
    const heightRatio = containerHeight / selectionHeight

    // Use the smaller ratio to ensure the entire selection is visible
    const newScale = Math.min(widthRatio, heightRatio) * 0.8 // 80% to add some margin

    // Limit the maximum zoom level
    const limitedScale = Math.min(newScale, 5.0)

    // Set the new scale
    setScale(limitedScale)

    // Scroll to center the selection
    // This needs to be done after the canvas is rerendered with the new scale
    setTimeout(() => {
      if (!canvasContainerRef.current || !canvasRef.current) return

      const scaledCenterX = centerX * limitedScale
      const scaledCenterY = centerY * limitedScale

      const containerRect = container.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()

      const scrollX = scaledCenterX - containerRect.width / 2 + canvasRect.left - containerRect.left
      const scrollY = scaledCenterY - containerRect.height / 2 + canvasRect.top - containerRect.top

      container.scrollTo({
        left: scrollX,
        top: scrollY,
        behavior: "smooth",
      })
    }, 100)
  }

  const drawSelectionOverlay = () => {
    if (isSelecting && selectionStart && selectionEnd) {
      const left = Math.min(selectionStart.x, selectionEnd.x) * scale
      const top = Math.min(selectionStart.y, selectionEnd.y) * scale
      const width = Math.abs(selectionEnd.x - selectionStart.x) * scale
      const height = Math.abs(selectionEnd.y - selectionStart.y) * scale

      return (
        <div
          className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      )
    }

    if (highlightStart && selectionEnd) {
      const left = Math.min(highlightStart.x, selectionEnd.x) * scale
      const top = Math.min(highlightStart.y, selectionEnd.y) * scale
      const width = Math.abs(selectionEnd.x - highlightStart.x) * scale
      const height = Math.abs(selectionEnd.y - highlightStart.y) * scale

      return (
        <div
          className="absolute border-2 border-yellow-500 bg-yellow-500/20 pointer-events-none"
          style={{
            left: `${left}px`,
            top: `${top}px`,
            width: `${width}px`,
            height: `${height}px`,
          }}
        />
      )
    }

    return null
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] flex-col md:flex-row bg-white rounded-lg shadow-lg">
      {/* Left sidebar - Annotation list */}
      <div className="w-full border-r md:w-80">
        <div className="flex h-full flex-col">
          <div className="border-b p-4">
            <Tabs defaultValue="annotations" onValueChange={(value) => setSidebarTab(value as any)}>
              <TabsList className="w-full">
                <TabsTrigger value="annotations" className="flex-1">
                  Annotations
                </TabsTrigger>
                <TabsTrigger value="outline" className="flex-1">
                  Outline
                </TabsTrigger>
              </TabsList>

              <TabsContent value="annotations" className="mt-4">
                <AnnotationFilterPanel categories={CATEGORIES} onFilterChange={setFilter} totalPages={totalPages} />
              </TabsContent>

              <TabsContent value="outline" className="mt-4">
                <div className="text-sm text-gray-500">Document outline will appear here when available.</div>
              </TabsContent>
            </Tabs>
          </div>

          {sidebarTab === "annotations" && (
            <ScrollArea className="flex-1">
              <div className="p-4">
                {pageAnnotations.length === 0 ? (
                  <div className="text-center text-sm text-gray-500">
                    {filter.searchQuery || filter.category || filter.type || filter.page || filter.dateRange
                      ? "No annotations match your filters"
                      : "No annotations found on this page"}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pageAnnotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className={cn(
                          "rounded-md border p-3 transition-colors",
                          activeAnnotation === annotation.id ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50",
                          annotation.userId !== user?.id ? "border-dashed" : "",
                        )}
                        onClick={() => {
                          setActiveAnnotation(annotation.id)
                          setCurrentPage(annotation.page)
                        }}
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: annotation.color }} />
                            <span className="text-xs font-medium">
                              {annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}
                            </span>
                            {annotation.category && (
                              <Badge variant="outline" className="text-xs">
                                {annotation.category}
                              </Badge>
                            )}
                            {annotation.userId !== user?.id && (
                              <Badge variant="secondary" className="text-xs">
                                Other User
                              </Badge>
                            )}
                          </div>
                          {annotation.userId === user?.id && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditAnnotation(annotation.id)
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-600"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteAnnotation(annotation.id)
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>

                        {editingAnnotation === annotation.id ? (
                          <div className="mt-2">
                            <Textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="min-h-[80px] text-sm"
                            />
                            <div className="mt-2 flex justify-end gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setEditingAnnotation(null)}>
                                Cancel
                              </Button>
                              <Button size="sm" onClick={() => handleSaveEdit(annotation.id)}>
                                Save
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {annotation.content && <p className="text-sm">{annotation.content}</p>}
                            <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                              <span>Page {annotation.page}</span>
                              <span>
                                {new Date(annotation.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {sidebarTab === "outline" && (
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="space-y-2">
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                    <p className="font-medium">Cover Page</p>
                  </div>
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                    <p className="font-medium">Table of Contents</p>
                  </div>
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                    <p className="font-medium">Chapter 1: Introduction</p>
                  </div>
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-md pl-4">
                    <p>1.1 Background</p>
                  </div>
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-md pl-4">
                    <p>1.2 Objectives</p>
                  </div>
                  <div className="cursor-pointer hover:bg-gray-50 p-2 rounded-md">
                    <p className="font-medium">Chapter 2: Methodology</p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Main content - PDF viewer */}
      <div className="flex flex-1 flex-col">
        <div className="bg-gray-50 border-b p-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-white rounded-md shadow-sm border">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={tool === "highlight" ? "bg-blue-50 text-blue-600" : ""}
                      onClick={() => setTool("highlight")}
                    >
                      <Highlighter className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Highlight Text</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={tool === "pen" ? "bg-blue-50 text-blue-600" : ""}
                      onClick={() => setTool("pen")}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Draw</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={tool === "comment" ? "bg-blue-50 text-blue-600" : ""}
                      onClick={() => setTool("comment")}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Add Comment</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={tool === "eraser" ? "bg-blue-50 text-blue-600" : ""}
                      onClick={() => setTool("eraser")}
                    >
                      <Eraser className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Eraser</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={tool === "area-zoom" ? "bg-blue-50 text-blue-600" : ""}
                      onClick={() => setTool("area-zoom")}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Zoom to Area</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="h-6 border-l mx-1"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex gap-2 h-8 bg-white">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: highlightColor }}></div>
                  <span>Color</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-[300px] overflow-y-auto">
                {HIGHLIGHT_COLORS.map((color) => (
                  <DropdownMenuItem
                    key={color.value}
                    onClick={() => setHighlightColor(color.value)}
                    className="flex gap-2"
                  >
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.value }}></div>
                    {color.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1 bg-white rounded-md shadow-sm border ml-auto">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                aria-label="Zoom out"
                onMouseDown={(e) => e.preventDefault()}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                onClick={handleResetZoom}
                className="text-xs min-w-[60px]"
                aria-label="Reset zoom"
                onMouseDown={(e) => e.preventDefault()}
              >
                {Math.round(scale * 100)}%
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                aria-label="Zoom in"
                onMouseDown={(e) => e.preventDefault()}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-white" onClick={handleSaveAnnotations}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>

              {/* Export Dialog */}
              <ExportDialog pdfUrl={pdfUrl} annotations={annotations} />
            </div>
          </div>
        </div>

        <div
          className="relative flex-1 overflow-auto bg-gray-100 flex justify-center p-4"
          ref={canvasContainerRef}
          style={{ touchAction: "none" }}
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="relative" style={{ touchAction: "none" }}>
                <canvas
                  ref={canvasRef}
                  className="shadow-lg bg-white"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{ touchAction: "none" }}
                />
                {drawSelectionOverlay()}
              </div>

              {commentPosition && (
                <div
                  className="absolute bg-white p-4 rounded-md shadow-lg border"
                  style={{
                    left: commentPosition.x * scale + 20,
                    top: commentPosition.y * scale + 20,
                    width: "300px",
                  }}
                >
                  <div className="mb-3 flex justify-between items-center">
                    <h4 className="font-medium">Add Comment</h4>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelComment}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="comment-text">Comment</Label>
                      <Textarea
                        id="comment-text"
                        placeholder="Add your comment here..."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="comment-category">Category</Label>
                      <select
                        id="comment-category"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={commentCategory}
                        onChange={(e) => setCommentCategory(e.target.value)}
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category.name} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={handleCancelComment}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddComment} className="bg-blue-600 hover:bg-blue-700">
                        Add Comment
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between border-t p-2 bg-gray-50">
          <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage <= 1} className="bg-white">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = Number.parseInt(e.target.value)
                if (page >= 1 && page <= totalPages) {
                  setCurrentPage(page)
                }
              }}
              className="w-12 h-8 text-center border rounded-md"
            />
            <span className="text-sm">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className="bg-white"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}
