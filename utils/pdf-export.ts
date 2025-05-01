import { jsPDF } from "jspdf"
import type { Annotation } from "@/types/annotations"

// Function to generate a PDF with annotations
export async function generateAnnotatedPDF(
  originalPdfUrl: string,
  annotations: Annotation[],
  fileName = "annotated-document.pdf",
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // Create a new PDF document
      const pdf = new jsPDF()

      // In a real implementation, we would:
      // 1. Load the original PDF using PDF.js
      // 2. For each page, render the page to a canvas
      // 3. Draw the annotations on top of the canvas
      // 4. Add the canvas as an image to the new PDF

      // For this demo, we'll create a simplified version

      // Group annotations by page
      const annotationsByPage: Record<number, Annotation[]> = {}
      annotations.forEach((annotation) => {
        if (!annotationsByPage[annotation.page]) {
          annotationsByPage[annotation.page] = []
        }
        annotationsByPage[annotation.page].push(annotation)
      })

      // Add a title page
      pdf.setFontSize(22)
      pdf.text("Annotated Document", 105, 20, { align: "center" })
      pdf.setFontSize(14)
      pdf.text(`Original: ${originalPdfUrl.split("/").pop()}`, 105, 30, { align: "center" })
      pdf.text(`Exported on: ${new Date().toLocaleString()}`, 105, 40, { align: "center" })
      pdf.text(`Total annotations: ${annotations.length}`, 105, 50, { align: "center" })

      // Add a page for each page with annotations
      Object.keys(annotationsByPage).forEach((pageNum, index) => {
        const pageAnnotations = annotationsByPage[Number(pageNum)]

        // Add a new page
        pdf.addPage()

        // Add page header
        pdf.setFontSize(16)
        pdf.text(`Page ${pageNum}`, 105, 15, { align: "center" })

        // Add annotations
        pdf.setFontSize(12)
        let yPosition = 30

        pageAnnotations.forEach((annotation, i) => {
          // Set color based on annotation type
          const color = annotation.color.replace("#", "")
          pdf.setTextColor(
            Number.parseInt(color.substring(0, 2), 16),
            Number.parseInt(color.substring(2, 4), 16),
            Number.parseInt(color.substring(4, 6), 16),
          )

          // Add annotation type and content
          pdf.setFontSize(12)
          pdf.text(`${i + 1}. ${annotation.type.toUpperCase()}`, 20, yPosition)

          if (annotation.content) {
            pdf.setFontSize(10)
            // Split long content into multiple lines
            const contentLines = pdf.splitTextToSize(annotation.content, 170)
            pdf.text(contentLines, 25, yPosition + 5)
            yPosition += 10 + contentLines.length * 5
          } else {
            yPosition += 10
          }

          // Add metadata
          pdf.setFontSize(8)
          pdf.setTextColor(100, 100, 100)
          pdf.text(
            `Category: ${annotation.category || "None"} | Created: ${new Date(annotation.createdAt).toLocaleString()}`,
            25,
            yPosition,
          )

          yPosition += 15

          // If we're running out of space, add a new page
          if (yPosition > 270) {
            pdf.addPage()
            yPosition = 20
          }
        })
      })

      // Save the PDF
      const pdfOutput = pdf.output("datauristring")
      resolve(pdfOutput)
    } catch (error) {
      console.error("Error generating PDF:", error)
      reject(error)
    }
  })
}
