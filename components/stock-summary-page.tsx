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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase-client"

interface StockSummaryPageProps {
  user?: { id: string; phone: string; role: string }
  onLogout?: () => void
}

interface StockItem {
  category: string
  product: string
  size: string
  quantity: number
}

interface MonthlyData {
  month: string
  category: string
  product: string
  size: string
  produced: number
  sold: number
}

export default function StockSummaryPage({ user, onLogout }: StockSummaryPageProps) {
  const [stockData, setStockData] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // Items per page
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null) // null means "All"
  
  // Daily Production Summary states
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [productionData, setProductionData] = useState<any[]>([])
  const [loadingProduction, setLoadingProduction] = useState(false)
  const [productionPage, setProductionPage] = useState(1)
  const [productionPageSize] = useState(20)

  // Monthly Report states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState<string>("all")
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const [monthlyPage, setMonthlyPage] = useState(1)
  const [monthlyPageSize] = useState(20)

  // Fetch stock data from Supabase
  useEffect(() => {
    const fetchStockData = async () => {
      if (!user?.id) return

      try {
        setLoading(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("entry")
          .select("category, product, size, quantity")
          .eq("worker_id", user.id)

        if (error) {
          console.error("Error fetching stock data:", error)
          toast.error("Failed to load stock data")
          return
        }

        if (data) {
          // Format the data and filter out null/empty values
          const formattedData: StockItem[] = data
            .filter((entry: any) => entry.category && entry.product)
            .map((entry: any) => ({
              category: entry.category || "",
              product: entry.product || "",
              size: entry.size || "",
              quantity: parseFloat(entry.quantity) || 0,
            }))

          setStockData(formattedData)
        }
      } catch (err) {
        console.error("Error fetching stock data:", err)
        toast.error("Failed to load stock data")
      } finally {
        setLoading(false)
      }
    }

    fetchStockData()
  }, [user?.id])


  const handleExportToExcel = async () => {
    // Use filtered data for export
    const dataToExport = filteredStockData

    // Check if dataToExport is null, undefined, or empty
    if (!dataToExport || dataToExport.length === 0) {
      toast.error("No data to export", {
        description: "The stock table is empty. Please ensure there is data before exporting.",
      })
      return
    }

    // Validate that data contains valid entries (not all null/empty)
    const validData = dataToExport.filter(
      (item) => item && (item.product || item.category || item.quantity > 0)
    )

    if (validData.length === 0) {
      toast.error("No valid data to export", {
        description: "The stock data contains no valid entries. Please check your data.",
      })
      return
    }

    setExporting(true)

    try {
      // Check if we're in browser
      if (typeof window === "undefined") {
        throw new Error("xlsx can only be used in browser environment")
      }

      // Import xlsx dynamically
      // @ts-ignore - xlsx types
      const XLSX = await import("xlsx")
      
      // Handle both default export and named export
      const xlsxLib = XLSX.default || XLSX

      // Prepare data for Excel export
      const excelData = validData.map((item) => ({
        Product: `${item.category ? `${item.category}: ` : ""}${item.product || ""}${item.size ? ` ${item.size}` : ""}`.trim(),
        "Total Stock": item.quantity || 0,
      }))

      // Create a new workbook and worksheet
      const worksheet = xlsxLib.utils.json_to_sheet(excelData)
      const workbook = xlsxLib.utils.book_new()
      xlsxLib.utils.book_append_sheet(workbook, worksheet, "Stock Summary")

      // Set column widths
      worksheet["!cols"] = [
        { wch: 50 }, // Product column width
        { wch: 15 }, // Total Stock column width
      ]

      // Generate Excel file with .xlsx extension
      const fileName = `Stock_Summary_${new Date().toISOString().split("T")[0]}.xlsx`
      xlsxLib.writeFile(workbook, fileName)

      toast.success("Excel file exported successfully!", {
        description: `Exported ${validData.length} stock items.`,
      })
    } catch (error: any) {
      console.error("Error exporting to Excel:", error)
      const errorMessage = error?.message || "An error occurred while exporting. Please try again."
      
      // More specific error messages
      if (errorMessage.includes("Cannot find module")) {
        toast.error("Excel export library not found", {
          description: "Please ensure xlsx package is installed. Try: npm install xlsx",
        })
      } else {
        toast.error("Failed to export to Excel", {
          description: errorMessage,
        })
      }
    } finally {
      setExporting(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  // Fixed list of categories
  const categories = ["Doors", "Boards", "Plywood", "Shuttering Plywood"]

  // Filter stock data by selected category
  const filteredStockData = useMemo(() => {
    if (!selectedCategory) {
      return stockData
    }
    return stockData.filter((item) => item.category === selectedCategory)
  }, [stockData, selectedCategory])

  // Pagination calculations (based on filtered data)
  const totalPages = Math.ceil(filteredStockData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedData = filteredStockData.slice(startIndex, endIndex)

  // Reset to page 1 when filter or data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, stockData.length])

  // Fetch daily production data
  useEffect(() => {
    const fetchDailyProduction = async () => {
      try {
        setLoadingProduction(true)
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
        setLoadingProduction(false)
      }
    }

    fetchDailyProduction()
  }, [selectedDate])

  // Production pagination calculations
  const productionTotalPages = Math.ceil(productionData.length / productionPageSize)
  const productionStartIndex = (productionPage - 1) * productionPageSize
  const productionEndIndex = productionStartIndex + productionPageSize
  const paginatedProductionData = productionData.slice(productionStartIndex, productionEndIndex)

  // Reset production page when data changes
  useEffect(() => {
    setProductionPage(1)
  }, [productionData.length])

  // Calculate production totals
  const productionTotals = useMemo(() => {
    return {
      totalQuantity: productionData.reduce((sum, item) => sum + item.quantity, 0),
      totalEntries: productionData.reduce((sum, item) => sum + item.entries, 0),
    }
  }, [productionData])

  // Generate year options for monthly report
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Array.from({ length: 3 }, (_, i) => currentYear - i)
  }, [])

  // Generate month options for monthly report
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
        setLoadingMonthly(true)
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

          setMonthlyData(Object.values(grouped))
        }
      } catch (err) {
        console.error("Error fetching monthly data:", err)
        toast.error("Failed to load monthly data")
      } finally {
        setLoadingMonthly(false)
      }
    }

    fetchMonthlyData()
  }, [selectedYear, selectedMonth])

  // Filter monthly data based on selected month
  const filteredMonthlyData = useMemo(() => {
    if (selectedMonth === "all") {
      return monthlyData
    }
    return monthlyData.filter((item) => {
      const itemMonth = item.month.split("-")[1]
      return itemMonth === String(parseInt(selectedMonth)).padStart(2, "0")
    })
  }, [monthlyData, selectedMonth])

  // Monthly pagination calculations
  const monthlyTotalPages = Math.ceil(filteredMonthlyData.length / monthlyPageSize)
  const monthlyStartIndex = (monthlyPage - 1) * monthlyPageSize
  const monthlyEndIndex = monthlyStartIndex + monthlyPageSize
  const paginatedMonthlyData = filteredMonthlyData.slice(monthlyStartIndex, monthlyEndIndex)

  // Reset monthly page when data changes
  useEffect(() => {
    setMonthlyPage(1)
  }, [filteredMonthlyData.length])

  // Calculate monthly totals
  const monthlyTotals = useMemo(() => {
    return {
      totalProduced: filteredMonthlyData.reduce((sum, item) => sum + item.produced, 0),
      totalSold: filteredMonthlyData.reduce((sum, item) => sum + item.sold, 0),
      totalRemaining: filteredMonthlyData.reduce((sum, item) => sum + (item.produced - item.sold), 0),
    }
  }, [filteredMonthlyData])

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground mb-4">Stock Summary</h1>

      {/* Tabs */}
      <Tabs defaultValue="stock" className="space-y-6">
        <TabsList className="bg-muted/80 rounded-xl p-1">
          <TabsTrigger value="stock" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Stock Summary
          </TabsTrigger>
          <TabsTrigger value="daily-production" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Daily Reports
          </TabsTrigger>
          <TabsTrigger value="monthly-report" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            Monthly Report
          </TabsTrigger>
        </TabsList>

        {/* Stock Summary Tab */}
        <TabsContent value="stock" className="space-y-6">

      {/* Category Filter Buttons */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            onClick={() => setSelectedCategory(null)}
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            className={
              selectedCategory === null
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            }
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              onClick={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              className={
                selectedCategory === category
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={handleExportToExcel}
          variant="outline"
          disabled={exporting}
          className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {exporting ? "Loading..." : "Export to Excel"}
        </Button>
        <Button
          onClick={handlePrint}
          variant="outline"
          className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
        >
          Print
        </Button>
      </div>

      {/* Table */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
              <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold text-foreground">
                Product
              </th>
              <th className="px-4 py-3 text-left font-bold text-foreground">
                Total Stock
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={2} className="text-center py-8 text-muted-foreground">
                  Loading stock data...
                </td>
              </tr>
            ) : filteredStockData.length === 0 ? (
              <tr>
                <td colSpan={2} className="text-center py-8 text-muted-foreground">
                  {selectedCategory
                    ? `No stock data available for category: ${selectedCategory}`
                    : "No stock data available"}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr 
                  key={startIndex + index}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-foreground">
                    {item.category && `${item.category}: `}
                    {item.product}
                    {item.size && ` ${item.size}`}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {item.quantity.toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredStockData.length > 0 && (
        <div className="flex flex-col gap-2 mt-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-300 dark:border-gray-600">
          <p className="text-sm text-muted-foreground">
            Showing{" "}
            <span className="font-medium text-foreground">
              {filteredStockData.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredStockData.length)}
            </span>{" "}
            of <span className="font-medium text-foreground">{filteredStockData.length}</span> items
            {selectedCategory && (
              <span className="text-muted-foreground"> (filtered by: {selectedCategory})</span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
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
              disabled={currentPage === totalPages || filteredStockData.length === 0}
              className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Next
            </Button>
          </div>
        </div>
      )}
        </TabsContent>

        {/* Daily Production Summary Tab */}
        <TabsContent value="daily-production" className="space-y-6">
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
                  {productionTotals.totalQuantity.toLocaleString()}
                </p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-text-secondary text-sm mb-2">Total Entries</p>
                <p className="text-3xl font-bold text-primary">{productionTotals.totalEntries}</p>
              </div>
            </div>

            {/* Production Table */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold text-foreground">
                      Category
                    </th>
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold text-foreground">
                      Product
                    </th>
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold text-foreground">
                      Size
                    </th>
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-foreground">
                      Quantity
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-foreground">
                      Entries
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingProduction ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        Loading production data...
                      </td>
                    </tr>
                  ) : paginatedProductionData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground">
                        No production data available for this date
                      </td>
                    </tr>
                  ) : (
                    paginatedProductionData.map((item, index) => (
                      <tr
                        key={productionStartIndex + index}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-foreground font-medium">
                          {item.category}
                        </td>
                        <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-foreground">
                          {item.product}
                        </td>
                        <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-foreground">
                          {item.size || "-"}
                        </td>
                        <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-foreground font-medium">
                          {item.quantity.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground">
                          {item.entries}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Production Pagination */}
            {productionData.length > 0 && (
              <div className="flex flex-col gap-2 mt-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-300 dark:border-gray-600">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {productionData.length === 0 ? 0 : productionStartIndex + 1}-{Math.min(productionEndIndex, productionData.length)}
                  </span>{" "}
                  of <span className="font-medium text-foreground">{productionData.length}</span> items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProductionPage((p) => Math.max(1, p - 1))}
                    disabled={productionPage === 1}
                    className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page <span className="font-medium text-foreground">{productionPage}</span> of{" "}
                    <span className="font-medium text-foreground">{productionTotalPages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProductionPage((p) => Math.min(productionTotalPages, p + 1))}
                    disabled={productionPage === productionTotalPages || productionData.length === 0}
                    className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Monthly Report Tab */}
        <TabsContent value="monthly-report" className="space-y-6">
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
                <p className="text-3xl font-bold text-primary">{monthlyTotals.totalProduced.toLocaleString()}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-text-secondary text-sm mb-2">Total Sold</p>
                <p className="text-3xl font-bold text-accent">{monthlyTotals.totalSold.toLocaleString()}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <p className="text-text-secondary text-sm mb-2">Remaining Stock</p>
                <p className="text-3xl font-bold text-accent-alt">
                  {monthlyTotals.totalRemaining.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Monthly Report Table */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600">
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold text-foreground">
                      Month
                    </th>
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold text-foreground">
                      Category
                    </th>
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold text-foreground">
                      Product
                    </th>
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-left font-bold text-foreground">
                      Size
                    </th>
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-foreground">
                      Produced
                    </th>
                    <th className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-right font-bold text-foreground">
                      Sold
                    </th>
                    <th className="px-4 py-3 text-right font-bold text-foreground">
                      Remaining
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loadingMonthly ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        Loading monthly data...
                      </td>
                    </tr>
                  ) : paginatedMonthlyData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No data available for the selected period
                      </td>
                    </tr>
                  ) : (
                    paginatedMonthlyData.map((item, index) => {
                      const remaining = item.produced - item.sold
                      return (
                        <tr
                          key={monthlyStartIndex + index}
                          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-foreground font-medium">
                            {item.month}
                          </td>
                          <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-foreground">
                            {item.category}
                          </td>
                          <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-foreground">
                            {item.product}
                          </td>
                          <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-foreground">
                            {item.size || "-"}
                          </td>
                          <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-foreground font-medium">
                            {item.produced.toLocaleString()}
                          </td>
                          <td className="border-r border-gray-300 dark:border-gray-600 px-4 py-3 text-right text-foreground font-medium text-accent">
                            {item.sold.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right text-foreground font-medium text-accent-alt">
                            {remaining.toLocaleString()}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Monthly Pagination */}
            {filteredMonthlyData.length > 0 && (
              <div className="flex flex-col gap-2 mt-4 px-4 py-3 sm:flex-row sm:items-center sm:justify-between border-t border-gray-300 dark:border-gray-600">
                <p className="text-sm text-muted-foreground">
                  Showing{" "}
                  <span className="font-medium text-foreground">
                    {filteredMonthlyData.length === 0 ? 0 : monthlyStartIndex + 1}-{Math.min(monthlyEndIndex, filteredMonthlyData.length)}
                  </span>{" "}
                  of <span className="font-medium text-foreground">{filteredMonthlyData.length}</span> items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMonthlyPage((p) => Math.max(1, p - 1))}
                    disabled={monthlyPage === 1}
                    className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page <span className="font-medium text-foreground">{monthlyPage}</span> of{" "}
                    <span className="font-medium text-foreground">{monthlyTotalPages}</span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMonthlyPage((p) => Math.min(monthlyTotalPages, p + 1))}
                    disabled={monthlyPage === monthlyTotalPages || filteredMonthlyData.length === 0}
                    className="bg-gray-100 border-gray-300 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

