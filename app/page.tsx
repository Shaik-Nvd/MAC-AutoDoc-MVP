"use client"

import { useState } from "react"
import EnhancedPDFLibrary from "@/components/enhanced-pdf-library"
import PDFAnnotator from "@/components/pdf-annotator"
import ProtectedRoute from "@/components/protected-route"
import ModernHeader from "@/components/modern-header"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"

function PDFApp() {
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null)
  const [view, setView] = useState<"library" | "annotator">("library")

  const handleSelectPdf = (pdfUrl: string) => {
    setSelectedPdf(pdfUrl)
    setView("annotator")
  }

  const handleBackToLibrary = () => {
    setView("library")
  }

  return (
    <main className="flex min-h-screen flex-col">
      <ModernHeader />

      <div className="container mx-auto px-4 py-6 flex-1">
        <AnimatePresence mode="wait">
          {view === "library" ? (
            <motion.div
              key="library"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-screen-xl mx-auto"
            >
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                Your PDF Library
              </h1>
              <p className="text-gray-600 mb-8">
                Access, annotate, and collaborate on your PDF documents with powerful annotation tools.
              </p>
              <EnhancedPDFLibrary onSelectPdf={handleSelectPdf} />
            </motion.div>
          ) : (
            <motion.div
              key="annotator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="flex h-full flex-col"
            >
              <div className="mb-4 flex items-center">
                <Button variant="ghost" onClick={handleBackToLibrary} className="mr-4 button-hover">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Library
                </Button>
                <h2 className="text-xl font-medium">{selectedPdf ? selectedPdf.split("/").pop() : "PDF Annotator"}</h2>
              </div>
              {selectedPdf && <PDFAnnotator pdfUrl={selectedPdf} />}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <PDFApp />
    </ProtectedRoute>
  )
}
