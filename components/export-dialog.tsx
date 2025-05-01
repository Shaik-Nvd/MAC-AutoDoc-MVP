"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Loader2 } from "lucide-react"
import { generateAnnotatedPDF } from "@/utils/pdf-export"
import type { Annotation } from "@/types/annotations"

interface ExportDialogProps {
  pdfUrl: string
  annotations: Annotation[]
}

export default function ExportDialog({ pdfUrl, annotations }: ExportDialogProps) {
  const [fileName, setFileName] = useState(
    `annotated-${pdfUrl.split("/").pop()?.replace(".pdf", "") || "document"}.pdf`,
  )
  const [includeHighlights, setIncludeHighlights] = useState(true)
  const [includeComments, setIncludeComments] = useState(true)
  const [includeDrawings, setIncludeDrawings] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [exportedPdfUrl, setExportedPdfUrl] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Filter annotations based on user selection
      const filteredAnnotations = annotations.filter((annotation) => {
        if (annotation.type === "highlight" && !includeHighlights) return false
        if (annotation.type === "comment" && !includeComments) return false
        if (annotation.type === "drawing" && !includeDrawings) return false
        return true
      })

      // Generate PDF
      const pdfDataUri = await generateAnnotatedPDF(pdfUrl, filteredAnnotations, fileName)
      setExportedPdfUrl(pdfDataUri)
    } catch (error) {
      console.error("Error exporting PDF:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleDownload = () => {
    if (!exportedPdfUrl) return

    // Create a link element and trigger download
    const link = document.createElement("a")
    link.href = exportedPdfUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // Close dialog after download
    setOpen(false)
    // Reset state for next export
    setExportedPdfUrl(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-1" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Annotated PDF</DialogTitle>
          <DialogDescription>
            Create a new PDF with your annotations. Choose which types of annotations to include.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="filename">File name</Label>
            <Input id="filename" value={fileName} onChange={(e) => setFileName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Include annotation types</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-highlights"
                  checked={includeHighlights}
                  onCheckedChange={(checked) => setIncludeHighlights(checked as boolean)}
                />
                <Label htmlFor="include-highlights" className="cursor-pointer">
                  Highlights
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-comments"
                  checked={includeComments}
                  onCheckedChange={(checked) => setIncludeComments(checked as boolean)}
                />
                <Label htmlFor="include-comments" className="cursor-pointer">
                  Comments
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-drawings"
                  checked={includeDrawings}
                  onCheckedChange={(checked) => setIncludeDrawings(checked as boolean)}
                />
                <Label htmlFor="include-drawings" className="cursor-pointer">
                  Drawings
                </Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          {!exportedPdfUrl ? (
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...
                </>
              ) : (
                "Generate PDF"
              )}
            </Button>
          ) : (
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download PDF
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
