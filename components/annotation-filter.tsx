"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { AnnotationFilter } from "@/types/annotations"

interface AnnotationFilterProps {
  categories: { name: string; color: string }[]
  onFilterChange: (filter: AnnotationFilter) => void
  totalPages: number
}

export default function AnnotationFilterPanel({ categories, onFilterChange, totalPages }: AnnotationFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<"highlight" | "drawing" | "comment" | null>(null)
  const [selectedPage, setSelectedPage] = useState<number | null>(null)
  const [dateRange, setDateRange] = useState<{
    start: Date | null
    end: Date | null
  } | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = () => {
    onFilterChange({
      searchQuery,
      category: selectedCategory,
      type: selectedType,
      page: selectedPage,
      dateRange,
    })
  }

  const handleReset = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSelectedType(null)
    setSelectedPage(null)
    setDateRange(null)
    onFilterChange({})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search annotations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="outline" size="icon" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" />
        </Button>
        <Button onClick={handleSearch}>Search</Button>
      </div>

      {showFilters && (
        <div className="rounded-md border p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Advanced Filters</h3>
            <Button variant="ghost" size="sm" onClick={handleReset} className="h-8 px-2 text-xs">
              Reset All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type-filter">Annotation Type</Label>
              <Select
                value={selectedType || ""}
                onValueChange={(value) => setSelectedType(value ? (value as any) : null)}
              >
                <SelectTrigger id="type-filter">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="highlight">Highlights</SelectItem>
                  <SelectItem value="drawing">Drawings</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page-filter">Page Number</Label>
              <Select
                value={selectedPage?.toString() || ""}
                onValueChange={(value) => setSelectedPage(value ? Number.parseInt(value) : null)}
              >
                <SelectTrigger id="page-filter">
                  <SelectValue placeholder="All Pages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Pages</SelectItem>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      Page {i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.start && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.start ? format(dateRange.start, "PPP") : "Start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange?.start || undefined}
                      onSelect={(date) =>
                        setDateRange({
                          start: date,
                          end: dateRange?.end || null,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange?.end && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.end ? format(dateRange.end, "PPP") : "End date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange?.end || undefined}
                      onSelect={(date) =>
                        setDateRange({
                          start: dateRange?.start || null,
                          end: date,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {dateRange?.start && dateRange?.end && (
                <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setDateRange(null)}>
                  <X className="h-3 w-3 mr-1" /> Clear dates
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label>Categories</Label>
              <div className="flex flex-wrap gap-1">
                <Badge
                  variant={selectedCategory === null ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Badge>
                {categories.map((category) => (
                  <Badge
                    key={category.name}
                    variant={selectedCategory === category.name ? "default" : "outline"}
                    className="cursor-pointer"
                    style={{ backgroundColor: selectedCategory === category.name ? category.color : undefined }}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
