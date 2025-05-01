export interface Annotation {
  id: string
  type: "highlight" | "drawing" | "comment"
  page: number
  color: string
  content?: string
  position: { x: number; y: number; width?: number; height?: number }
  points?: Array<[number, number]>
  category?: string
  createdAt: Date
  userId: string
}

export interface AnnotationFilter {
  searchQuery?: string
  category?: string | null
  dateRange?: {
    start: Date | null
    end: Date | null
  } | null
  type?: "highlight" | "drawing" | "comment" | null
  page?: number | null
}
