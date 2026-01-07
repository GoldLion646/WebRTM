"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-client"

export default function DailyProductionSummary() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [productionData, setProductionData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // Fetch daily production data
  useEffect(() => {
    const fetchDailyProduction = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Get start and end of selected date
        const startDate = new Date(selectedDate)
        startDate.setHours(0, 0, 0, 0)
        const endDate = new Date(selectedDate)
        endDate.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
          .from("entry")
          .select("*")
          .gte("time_load_in", startDate.toISOString())
          .lte("time_load_in", endDate.toISOString())
          .order("time_load_in", { ascending: false })

        if (error) {
          console.error("Error fetching daily production:", error)
          toast.error("Failed to load production data")
          return
        }

        if (data) {
          // Group by category and product, sum quantities
          const grouped = data.reduce((acc: any, entry: any) => {
            const key = `${entry.category || "Unknown"}_${entry.product || "Unknown"}_${entry.size || ""}`
            if (!acc[key]) {
              acc[key] = {
                category: entry.category || "Unknown",
                product: entry.product || "Unknown",
                size: entry.size || "",
                quantity: 0,
                entries: 0,
              }
            }
            acc[key].quantity += parseFloat(entry.quantity) || 0
            acc[key].entries += 1
            return acc
          }, {})

          setProductionData(Object.values(grouped))
        }
      } catch (err) {
        console.error("Error fetching daily production:", err)
        toast.error("Failed to load production data")
      } finally {
        setLoading(false)
      }
    }

    fetchDailyProduction()
  }, [selectedDate])

  // Pagination calculations
  const totalPages = Math.ceil(productionData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = productionData.slice(startIndex, endIndex)

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [productionData.length])

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalQuantity: productionData.reduce((sum, item) => sum + item.quantity, 0),
      totalEntries: productionData.reduce((sum, item) => sum + item.entries, 0),
    }
  }, [productionData])

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Daily Reports</h2>

        {/* Date Selection */}
        <div className="mb-6">
          <Label htmlFor="summary-date" className="mb-2 block">
            Select Date
          </Label>
          <Input
            id="summary-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-xs"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text-secondary text-sm mb-2">Total Products</p>
            <p className="text-3xl font-bold text-primary">{productionData.length}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text-secondary text-sm mb-2">Total Quantity</p>
            <p className="text-3xl font-bold text-accent">
              {totals.totalQuantity.toLocaleString()}
            </p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text-secondary text-sm mb-2">Total Entries</p>
            <p className="text-3xl font-bold text-primary">{totals.totalEntries}</p>
          </div>
        </div>

        {/* Production Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Size</TableHead>
                <TableHead className="font-semibold text-right">Quantity</TableHead>
                <TableHead className="font-semibold text-right">Entries</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Loading production data...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No production data available for this date
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => (
                  <TableRow key={startIndex + index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.category}</TableCell>
                    <TableCell>{item.product}</TableCell>
                    <TableCell>{item.size || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      {item.quantity.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{item.entries}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {productionData.length > 0 && (
          <div className="flex flex-col gap-2 mt-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {productionData.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, productionData.length)}
              </span>{" "}
              of <span className="font-medium text-foreground">{productionData.length}</span> items
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || productionData.length === 0}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

