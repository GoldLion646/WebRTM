"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface MonthlyData {
  month: string
  category: string
  product: string
  size: string
  produced: number
  sold: number
}

export default function MonthlyReport() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [productionData, setProductionData] = useState<MonthlyData[]>([])
  const [salesData, setSalesData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)

  // Generate year options (current year and previous 2 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 3 }, (_, i) => currentYear - i)
  }, [])

  // Generate month options
  const monthOptions = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ]

  // Fetch monthly production and sales data
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Calculate date range
        const startDate = new Date(selectedYear, selectedMonth === "all" ? 0 : parseInt(selectedMonth) - 1, 1)
        const endDate = new Date(
          selectedYear,
          selectedMonth === "all" ? 11 : parseInt(selectedMonth) - 1,
          selectedMonth === "all" ? 31 : new Date(selectedYear, parseInt(selectedMonth), 0).getDate(),
          23,
          59,
          59,
        )

        // Fetch production data from entry table
        const { data: productionEntries, error: prodError } = await supabase
          .from("entry")
          .select("*")
          .gte("time_load_in", startDate.toISOString())
          .lte("time_load_in", endDate.toISOString())

        if (prodError) {
          console.error("Error fetching production data:", prodError)
          toast.error("Failed to load production data")
        }

        // Fetch sales data (if sales table exists, otherwise use empty array)
        // Note: You may need to create a 'sales' table in Supabase with columns:
        // id, category, product, size, quantity, sale_date, created_at
        let salesEntries: any[] = []
        try {
          const { data: salesData, error: salesError } = await supabase
            .from("sales")
            .select("*")
            .gte("sale_date", startDate.toISOString().split("T")[0])
            .lte("sale_date", endDate.toISOString().split("T")[0])

          if (!salesError && salesData) {
            salesEntries = salesData
          }
        } catch (err) {
          // Sales table might not exist yet
          console.log("Sales table not found, using empty data")
        }

        // Process production data
        if (productionEntries) {
          const grouped: Record<string, MonthlyData> = {}

          productionEntries.forEach((entry: any) => {
            const entryDate = new Date(entry.time_load_in)
            const monthKey = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, "0")}`
            const productKey = `${monthKey}_${entry.category || "Unknown"}_${entry.product || "Unknown"}_${entry.size || ""}`

            if (!grouped[productKey]) {
              grouped[productKey] = {
                month: monthKey,
                category: entry.category || "Unknown",
                product: entry.product || "Unknown",
                size: entry.size || "",
                produced: 0,
                sold: 0,
              }
            }
            grouped[productKey].produced += parseFloat(entry.quantity) || 0
          })

          // Process sales data
          salesEntries.forEach((sale: any) => {
            const saleDate = new Date(sale.sale_date)
            const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, "0")}`
            const productKey = `${monthKey}_${sale.category || "Unknown"}_${sale.product || "Unknown"}_${sale.size || ""}`

            if (!grouped[productKey]) {
              grouped[productKey] = {
                month: monthKey,
                category: sale.category || "Unknown",
                product: sale.product || "Unknown",
                size: sale.size || "",
                produced: 0,
                sold: 0,
              }
            }
            grouped[productKey].sold += parseFloat(sale.quantity) || 0
          })

          setProductionData(Object.values(grouped))
          setSalesData(salesEntries)
        }
      } catch (err) {
        console.error("Error fetching monthly data:", err)
        toast.error("Failed to load monthly data")
      } finally {
        setLoading(false)
      }
    }

    fetchMonthlyData()
  }, [selectedYear, selectedMonth])

  // Filter data based on selected month
  const filteredData = useMemo(() => {
    if (selectedMonth === "all") {
      return productionData
    }
    return productionData.filter((item) => {
      const itemMonth = item.month.split("-")[1]
      return itemMonth === String(parseInt(selectedMonth)).padStart(2, "0")
    })
  }, [productionData, selectedMonth])

  // Pagination calculations
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredData.slice(startIndex, endIndex)

  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filteredData.length])

  // Calculate totals
  const totals = useMemo(() => {
    return {
      totalProduced: filteredData.reduce((sum, item) => sum + item.produced, 0),
      totalSold: filteredData.reduce((sum, item) => sum + item.sold, 0),
      totalRemaining: filteredData.reduce((sum, item) => sum + (item.produced - item.sold), 0),
    }
  }, [filteredData])

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-2xl font-bold text-foreground mb-4">Monthly Report</h2>
        <p className="text-text-secondary mb-6">Goods Produced and Sold (Month-wise)</p>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="report-year">Select Year</Label>
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger id="report-year">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-month">Select Month</Label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger id="report-month">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text-secondary text-sm mb-2">Total Produced</p>
            <p className="text-3xl font-bold text-primary">{totals.totalProduced.toLocaleString()}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text-secondary text-sm mb-2">Total Sold</p>
            <p className="text-3xl font-bold text-accent">{totals.totalSold.toLocaleString()}</p>
          </div>
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-text-secondary text-sm mb-2">Remaining Stock</p>
            <p className="text-3xl font-bold text-accent-alt">
              {totals.totalRemaining.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Monthly Report Table */}
        <div className="border border-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead className="font-semibold">Month</TableHead>
                <TableHead className="font-semibold">Category</TableHead>
                <TableHead className="font-semibold">Product</TableHead>
                <TableHead className="font-semibold">Size</TableHead>
                <TableHead className="font-semibold text-right">Produced</TableHead>
                <TableHead className="font-semibold text-right">Sold</TableHead>
                <TableHead className="font-semibold text-right">Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading monthly data...
                  </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No data available for the selected period
                  </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, index) => {
                  const remaining = item.produced - item.sold
                  return (
                    <TableRow key={startIndex + index} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell>{item.product}</TableCell>
                      <TableCell>{item.size || "-"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.produced.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-accent">
                        {item.sold.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium text-accent-alt">
                        {remaining.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredData.length > 0 && (
          <div className="flex flex-col gap-2 mt-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredData.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredData.length)}
              </span>{" "}
              of <span className="font-medium text-foreground">{filteredData.length}</span> items
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
                disabled={currentPage === totalPages || filteredData.length === 0}
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

