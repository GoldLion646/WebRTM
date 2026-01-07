"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { User, Metric } from "@/lib/types"
import { toast } from "sonner"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase-client"

interface OperatorDashboardProps {
  user: User
  onLogout: () => void
  onSubmitMetric: (metric: Metric) => void
}

export default function OperatorDashboard({ user, onLogout, onSubmitMetric }: OperatorDashboardProps) {
  const [hotPress, setHotPress] = useState("")
  const [category, setCategory] = useState("")
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedSize, setSelectedSize] = useState("")
  const [thickness, setThickness] = useState("")
  const [glueType, setGlueType] = useState("")
  const [doorsType, setDoorsType] = useState("")
  const [boardsType, setBoardsType] = useState("")
  const [plywoodProduct, setPlywoodProduct] = useState("")
  const [plywoodType, setPlywoodType] = useState("")
  const [face, setFace] = useState("")
  const [weight, setWeight] = useState("")
  const [quantity, setQuantity] = useState("")
  const [loadInTime, setLoadInTime] = useState<string | null>(null)
  const [loadOutTime, setLoadOutTime] = useState<string | null>(null)
  const [temperature, setTemperature] = useState("")
  const [pressure, setPressure] = useState("")
  const [saving, setSaving] = useState(false)
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null)
  const [workPlace, setWorkPlace] = useState<string | null>(null)
  const [loadingAssignment, setLoadingAssignment] = useState(true)
  const [shift, setShift] = useState<"Day" | "Night">("Day")
  const [entries, setEntries] = useState<Array<{
    date: string
    shift: string
    size: string
    product: string
    qty: string
    loadIn: string
    loadOut: string
    temp: string
    pressure: string
  }>>([])
  const [loadingEntries, setLoadingEntries] = useState(false)

  const hotPressOptions = ["HP1", "HP2", "HP3", "HP4"]
  const categoryOptions = ["Boards", "Doors", "Plywood", "Shuttering Plywood"]

  // Fetch operator assignment on component mount
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        setLoadingAssignment(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("assignoperators")
          .select("work_place")
          .eq("profile_id", user.id)
          .single()

        if (error) {
          // If no record found, that's okay - work_place will be null
          if (error.code !== "PGRST116") {
            console.error("Error fetching assignment:", error)
          }
          setWorkPlace(null)
          return
        }

        if (data) {
          setWorkPlace(data.work_place)

          // If work_place is not null, set it as the selected hot press
          if (data.work_place) {
            setHotPress(data.work_place)
          }
        } else {
          setWorkPlace(null)
        }
      } catch (err) {
        console.error("Error fetching operator assignment:", err)
        setWorkPlace(null)
      } finally {
        setLoadingAssignment(false)
      }
    }

    if (user?.id) {
      fetchAssignment()
    }
  }, [user?.id])

  // Fetch entries from Supabase
  useEffect(() => {
    const fetchEntries = async () => {
      if (!user?.id) return

      try {
        setLoadingEntries(true)
        const supabase = createClient()

        const { data, error } = await supabase
          .from("entry")
          .select("*")
          .eq("worker_id", user.id)
          .order("time_load_in", { ascending: false })

        if (error) {
          console.error("Error fetching entries:", error)
          return
        }

        // Fetch assignoperators data separately
        const { data: assignData } = await supabase
          .from("assignoperators")
          .select("profile_id, work_type")
          .eq("profile_id", user.id)
          .single()

        if (data) {
          console.log("data=>", data);
          // Format entries for display
          const formattedEntries = data.map((entry: any) => {
            const loadInDate = entry.time_load_in ? new Date(entry.time_load_in) : null
            const loadOutDate = entry.time_load_out ? new Date(entry.time_load_out) : null

            return {
              date: loadInDate ? loadInDate.toLocaleDateString() : "",
              shift: assignData?.work_type || shift, // Use assignoperators work_type or default shift
              size: entry.size || "",
              product: entry.product || "",
              qty: entry.quantity || "",
              loadIn: loadInDate ? loadInDate.toLocaleTimeString() : "",
              loadOut: loadOutDate ? loadOutDate.toLocaleTimeString() : "",
              temp: entry.temperature || "",
              pressure: entry.pressure || "",
            }
          })

          setEntries(formattedEntries)
        }
      } catch (err) {
        console.error("Error fetching entries:", err)
      } finally {
        setLoadingEntries(false)
      }
    }

    if (user?.id) {
      fetchEntries()
    }
  }, [user?.id, shift])

  // Get unique products filtered by selected category
  const productOptions = useMemo((): Array<{ value: string; label: string; thickness: string; type: string }> => {
    // Return empty array since CSV loading is removed
    return []
  }, [category])

  // Get unique sizes filtered by selected category and product
  const sizeOptions = useMemo((): Array<{ value: string; label: string }> => {
    // Return empty array since CSV loading is removed
    return []
  }, [category, selectedProduct])

  // Reset selected product when category changes
  useEffect(() => {
    setSelectedProduct("")
    setSelectedSize("")
    setThickness("")
    setGlueType("")
    setDoorsType("")
    setBoardsType("")
    setPlywoodProduct("")
    setPlywoodType("")
    setFace("")
    setWeight("")
    
    // Set defaults for Shuttering category
    if (category.toLowerCase() === "shuttering" || category.toLowerCase() === "shuttering plywood") {
      setThickness("12")
      setGlueType("PF")
      setWeight("30")
      setSelectedSize("8x4")
    }
    
    // Set defaults for Doors category
    if (category.toLowerCase() === "doors") {
      setThickness("32")
      setDoorsType("PF")
    }
    
    // Set defaults for Boards category
    if (category.toLowerCase() === "boards") {
      setThickness("18")
      setBoardsType("PF")
    }
    
    // Set defaults for Plywood category
    if (category.toLowerCase() === "plywood") {
      setThickness("18")
    }
  }, [category])

  // Reset selected size when product changes
  useEffect(() => {
    setSelectedSize("")
  }, [selectedProduct])

  const handleMarkLoadIn = async () => {
    const isShuttering = category.toLowerCase() === "shuttering" || category.toLowerCase() === "shuttering plywood"
    const isDoors = category.toLowerCase() === "doors"
    const isBoards = category.toLowerCase() === "boards"
    const isPlywood = category.toLowerCase() === "plywood"
    
    // Validate based on category
    if (isShuttering) {
      if (!thickness || !glueType || !face || !weight || !selectedSize) {
        toast.error("Please fill all required fields for Shuttering")
        return
      }
    } else if (isDoors) {
      if (!thickness || !doorsType || !face || !selectedSize) {
        toast.error("Please fill all required fields for Doors")
        return
      }
    } else if (isBoards) {
      if (!thickness || !boardsType || !face || !selectedSize) {
        toast.error("Please fill all required fields for Boards")
        return
      }
    } else if (isPlywood) {
      if (!thickness || !plywoodProduct || !plywoodType || !face || !selectedSize) {
        toast.error("Please fill all required fields for Plywood")
        return
      }
    } else {
      if (!selectedProduct) {
        toast.error("Please select a product")
        return
      }
      if (!selectedSize) {
        toast.error("Please select a size")
        return
      }
    }

    try {
      const supabase = createClient()

      // Get product label based on category
      let productLabel = ""
      if (isShuttering) {
        productLabel = `${thickness}mm ${glueType} ${face} ${weight}kg`
      } else if (isDoors) {
        productLabel = `${thickness}mm ${doorsType} ${face}`
      } else if (isBoards) {
        productLabel = `${thickness}mm ${boardsType} ${face}`
      } else if (isPlywood) {
        productLabel = `${thickness}mm ${plywoodProduct} ${plywoodType} ${face}`
      } else {
        productLabel = productOptions.find(p => p.value === selectedProduct)?.label || selectedProduct
      }

      // Save to Supabase entry table
      const { data, error } = await supabase
        .from("entry")
        .insert({
          worker_id: user.id,
          category: category,
          product: productLabel,
          size: selectedSize,
          quantity: quantity || null,
          temperature: temperature || null,
          pressure: pressure || null,
          time_load_in: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error("Error saving entry:", error)
        toast.error("Failed to save entry", {
          description: error.message || "Please try again.",
        })
        return
      }

      console.log("data", data);

      // Store the entry ID for later updates
      if (data?.id) {
        setCurrentEntryId(data.id)
      }

      setLoadInTime(new Date().toISOString())
      toast.success("Load In time marked and entry saved successfully!")

      // Refresh entries from Supabase
      const { data: refreshedData, error: refreshError } = await supabase
        .from("entry")
        .select("*")
        .eq("worker_id", user.id)
        .order("time_load_in", { ascending: false })

      // Fetch assignoperators data separately
      const { data: assignData } = await supabase
        .from("assignoperators")
        .select("profile_id, work_type")
        .eq("profile_id", user.id)
        .single()

      if (!refreshError && refreshedData) {
        const formattedEntries = refreshedData.map((entry: any) => {
          const loadInDate = entry.time_load_in ? new Date(entry.time_load_in) : null
          const loadOutDate = entry.time_load_out ? new Date(entry.time_load_out) : null

          return {
            date: loadInDate ? loadInDate.toLocaleDateString() : "",
            shift: assignData?.work_type || shift,
            size: entry.size || "",
            product: entry.product || "",
            qty: entry.quantity || "",
            loadIn: loadInDate ? loadInDate.toLocaleTimeString() : "",
            loadOut: loadOutDate ? loadOutDate.toLocaleTimeString() : "",
            temp: entry.temperature || "",
            pressure: entry.pressure || "",
          }
        })

        setEntries(formattedEntries)
      }
    } catch (err) {
      console.error("[mark-load-in] error", err)
      toast.error("Could not save entry", {
        description: "Please try again.",
      })
    }
  }

  const handleMarkLoadOut = async () => {

    try {
      const supabase = createClient()
      const currentTime = new Date().toISOString()

      // Update time_load_out in Supabase
      const { error } = await supabase
        .from("entry")
        .update({ time_load_out: currentTime })
        .eq("worker_id", user.id)


      if (error) {
        console.error("Error updating load out time:", error)
        toast.error("Failed to update load out time", {
          description: error.message || "Please try again.",
        })
        return
      }

      setLoadOutTime(currentTime)
      toast.success("Load Out time marked and saved successfully!")

      // Refresh entries from Supabase
      const { data: refreshedData, error: refreshError } = await supabase
        .from("entry")
        .select("*")
        .eq("worker_id", user.id)
        .order("time_load_in", { ascending: false })

      // Fetch assignoperators data separately
      const { data: assignData } = await supabase
        .from("assignoperators")
        .select("profile_id, work_type")
        .eq("profile_id", user.id)
        .single()

      if (!refreshError && refreshedData) {
        const formattedEntries = refreshedData.map((entry: any) => {
          const loadInDate = entry.time_load_in ? new Date(entry.time_load_in) : null
          const loadOutDate = entry.time_load_out ? new Date(entry.time_load_out) : null

          return {
            date: loadInDate ? loadInDate.toLocaleDateString() : "",
            shift: assignData?.work_type || shift,
            size: entry.size || "",
            product: entry.product || "",
            qty: entry.quantity || "",
            loadIn: loadInDate ? loadInDate.toLocaleTimeString() : "",
            loadOut: loadOutDate ? loadOutDate.toLocaleTimeString() : "",
            temp: entry.temperature || "",
            pressure: entry.pressure || "",
          }
        })

        setEntries(formattedEntries)
      }
    } catch (err) {
      console.error("[mark-load-out] error", err)
      toast.error("Could not update load out time", {
        description: "Please try again.",
      })
    }
  }

  const handleSaveEntry = async () => {
    try {
      setSaving(true)

      // Update time_load_out if entry exists
      if (currentEntryId) {
        const supabase = createClient()
        const currentTime = new Date().toISOString()

        const { error: updateError } = await supabase
          .from("entry")
          .update({ time_load_out: currentTime })
          .eq("work_id", user.id)

        if (updateError) {
          console.error("Error updating load out time:", updateError)
          toast.error("Failed to update load out time", {
            description: updateError.message || "Please try again.",
          })
        } else {
          setLoadOutTime(currentTime)
        }
      }

      // // Submit as metric for backward compatibility
      // onSubmitMetric({
      //   id: "",
      //   line: hotPress,
      //   widget: category,
      //   output: Number.parseFloat(quantity) || 0,
      //   quality: Number.parseFloat(temperature) || 0,
      //   efficiency: Number.parseFloat(pressure) || 0,
      //   timestamp: new Date(),
      //   operator: user.phone,
      // })

      // Refresh entries from Supabase
      const supabase = createClient()
      const { data: refreshedData, error: refreshError } = await supabase
        .from("entry")
        .select("*")
        .eq("worker_id", user.id)
        .order("time_load_in", { ascending: false })

      // Fetch assignoperators data separately
      const { data: assignData } = await supabase
        .from("assignoperators")
        .select("profile_id, work_type")
        .eq("profile_id", user.id)
        .single()

      if (!refreshError && refreshedData) {
        const formattedEntries = refreshedData.map((entry: any) => {
          const loadInDate = entry.time_load_in ? new Date(entry.time_load_in) : null
          const loadOutDate = entry.time_load_out ? new Date(entry.time_load_out) : null

          return {
            date: loadInDate ? loadInDate.toLocaleDateString() : "",
            shift: assignData?.work_type || shift,
            size: entry.size || "",
            product: entry.product || "",
            qty: entry.quantity || "",
            loadIn: loadInDate ? loadInDate.toLocaleTimeString() : "",
            loadOut: loadOutDate ? loadOutDate.toLocaleTimeString() : "",
            temp: entry.temperature || "",
            pressure: entry.pressure || "",
          }
        })

        setEntries(formattedEntries)
      }

      toast.success("Entry saved successfully!", {
        description: "Production entry has been saved.",
      })

      // Reset form
      setCategory("")
      setSelectedProduct("")
      setSelectedSize("")
      setThickness("")
      setGlueType("")
      setDoorsType("")
      setBoardsType("")
      setPlywoodProduct("")
      setPlywoodType("")
      setFace("")
      setWeight("")
      setQuantity("")
      setLoadInTime(null)
      setLoadOutTime(null)
      setTemperature("")
      setPressure("")
      setCurrentEntryId(null)
    } catch (err) {
      console.error("[quick-entry] save error", err)
      toast.error("Could not save entry", {
        description: "Please try again.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Production Data Entry</h1>
            <p className="text-text-secondary text-sm">Operator: {user.phone}</p>
          </div>
          <Button
            onClick={onLogout}
            variant="outline"
            className="gap-2 px-4 py-2 border-destructive/60 text-destructive hover:text-destructive hover:border-destructive shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Select Hot Press Section */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-3">Select Hot Press:</label>
          <div className="flex gap-3">
            {hotPressOptions.map((hp) => {
              // If work_place is not null, disable buttons that don't match work_place
              const isDisabled = workPlace !== null && hp !== workPlace
              const isSelected = hotPress === hp

              return (
                <Button
                  key={hp}
                  onClick={() => {
                    // Only allow selection if work_place is null or matches
                    if (workPlace === null || hp === workPlace) {
                      setHotPress(hp)
                    }
                  }}
                  disabled={isDisabled || loadingAssignment}
                  variant={isSelected ? "default" : "outline"}
                  className={cn(
                    "rounded-md px-6 py-3 text-sm font-medium transition-all border",
                    isSelected
                      ? "bg-primary text-white hover:bg-primary/90 border-primary"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600",
                    isDisabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {hp}
                </Button>
              )
            })}
          </div>
        </div>

        {/* Select Category Section */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-foreground mb-3">Select Category:</label>
          <div className="flex gap-3 flex-wrap">
            {categoryOptions.map((cat) => (
              <Button
                key={cat}
                onClick={() => setCategory(cat)}
                variant={category === cat ? "default" : "outline"}
                className={cn(
                  "rounded-md px-6 py-3 text-sm font-medium transition-all border",
                  category === cat
                    ? "bg-primary text-white hover:bg-primary/90 border-primary"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                )}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Entry Form */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <div className="flex flex-wrap items-center gap-3">
            {/* Shuttering Category Fields */}
            {(category.toLowerCase() === "shuttering" || category.toLowerCase() === "shuttering plywood") ? (
              <>
                <Select value={thickness} onValueChange={setThickness}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Thickness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12mm</SelectItem>
                    <SelectItem value="16">16mm</SelectItem>
                    <SelectItem value="18">18mm</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={glueType} onValueChange={setGlueType}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Glue Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">PF</SelectItem>
                    <SelectItem value="UF">UF</SelectItem>
                    <SelectItem value="MR">MR</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={face} onValueChange={setFace}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Select Face" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plain">Plain</SelectItem>
                    <SelectItem value="Veneer">Veneer</SelectItem>
                    <SelectItem value="Melamine">Melamine</SelectItem>
                    <SelectItem value="Laminate">Laminate</SelectItem>
                    <SelectItem value="Painted">Painted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={weight} onValueChange={setWeight}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25 kg</SelectItem>
                    <SelectItem value="26">26 kg</SelectItem>
                    <SelectItem value="28">28 kg</SelectItem>
                    <SelectItem value="30">30 kg</SelectItem>
                    <SelectItem value="34">34 kg</SelectItem>
                    <SelectItem value="40">40 kg</SelectItem>
                    <SelectItem value="45">45 kg</SelectItem>
                    <SelectItem value="50">50 kg</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8x4">8x4</SelectItem>
                    <SelectItem value="6x4">6x4</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : category.toLowerCase() === "doors" ? (
              <>
                <Select value={thickness} onValueChange={setThickness}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Thickness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="32">32mm</SelectItem>
                    <SelectItem value="30">30mm</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={doorsType} onValueChange={setDoorsType}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">PF</SelectItem>
                    <SelectItem value="MR">MR</SelectItem>
                    <SelectItem value="Jabra">Jabra</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={face} onValueChange={setFace}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Select Face" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plain">Plain</SelectItem>
                    <SelectItem value="Veneer">Veneer</SelectItem>
                    <SelectItem value="Melamine">Melamine</SelectItem>
                    <SelectItem value="Laminate">Laminate</SelectItem>
                    <SelectItem value="Painted">Painted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8x4">8x4</SelectItem>
                    <SelectItem value="6x4">6x4</SelectItem>
                    <SelectItem value="7x4">7x4</SelectItem>
                    <SelectItem value="9x4">9x4</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : category.toLowerCase() === "boards" ? (
              <>
                <Select value={thickness} onValueChange={setThickness}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Thickness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25mm</SelectItem>
                    <SelectItem value="19">19mm</SelectItem>
                    <SelectItem value="18">18mm</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={boardsType} onValueChange={setBoardsType}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">PF</SelectItem>
                    <SelectItem value="MR">MR</SelectItem>
                    <SelectItem value="Jabra">Jabra</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={face} onValueChange={setFace}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Select Face" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plain">Plain</SelectItem>
                    <SelectItem value="Veneer">Veneer</SelectItem>
                    <SelectItem value="Melamine">Melamine</SelectItem>
                    <SelectItem value="Laminate">Laminate</SelectItem>
                    <SelectItem value="Painted">Painted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8x4">8x4</SelectItem>
                    <SelectItem value="6x4">6x4</SelectItem>
                    <SelectItem value="7x4">7x4</SelectItem>
                    <SelectItem value="9x4">9x4</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : category.toLowerCase() === "plywood" ? (
              <>
                <Select value={thickness} onValueChange={setThickness}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Thickness" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25mm</SelectItem>
                    <SelectItem value="19">19mm</SelectItem>
                    <SelectItem value="16">16mm</SelectItem>
                    <SelectItem value="15">15mm</SelectItem>
                    <SelectItem value="12">12mm</SelectItem>
                    <SelectItem value="9">9mm</SelectItem>
                    <SelectItem value="6">6mm</SelectItem>
                    <SelectItem value="3">3mm</SelectItem>
                    <SelectItem value="18">18mm</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={plywoodProduct} onValueChange={setPlywoodProduct}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Red">Red</SelectItem>
                    <SelectItem value="Alternate">Alternate</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={plywoodType} onValueChange={setPlywoodType}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PF">PF</SelectItem>
                    <SelectItem value="MR">MR</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={face} onValueChange={setFace}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Select Face" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plain">Plain</SelectItem>
                    <SelectItem value="Veneer">Veneer</SelectItem>
                    <SelectItem value="Melamine">Melamine</SelectItem>
                    <SelectItem value="Laminate">Laminate</SelectItem>
                    <SelectItem value="Painted">Painted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={selectedSize} onValueChange={setSelectedSize}>
                  <SelectTrigger className="flex-1 min-w-[120px] rounded-md">
                    <SelectValue placeholder="Size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8x4">8x4</SelectItem>
                    <SelectItem value="6x4">6x4</SelectItem>
                    <SelectItem value="7x4">7x4</SelectItem>
                    <SelectItem value="9x4">9x4</SelectItem>
                  </SelectContent>
                </Select>
              </>
            ) : (
              <>
                {category && (
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger className="flex-1 min-w-[200px] rounded-md">
                      <SelectValue placeholder="Select Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {productOptions.length > 0 ? (
                        productOptions.map((product) => (
                          <SelectItem key={product.value} value={product.value}>
                            {product.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-products" disabled>
                          No products found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
                {selectedProduct && (
                  <Select value={selectedSize} onValueChange={setSelectedSize}>
                    <SelectTrigger className="flex-1 min-w-[150px] rounded-md">
                      <SelectValue placeholder="Select Size" />
                    </SelectTrigger>
                    <SelectContent>
                      {sizeOptions.length > 0 ? (
                        sizeOptions.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-sizes" disabled>
                          No sizes found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
            <Input
              type="number"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="flex-1 min-w-[120px] rounded-md"
            />
            <Button
              onClick={handleMarkLoadIn}
              variant={loadInTime ? "default" : "outline"}
              className="rounded-md"
            >
              Mark Load In
            </Button>
            <Button
              onClick={handleMarkLoadOut}
              variant={loadOutTime ? "default" : "outline"}
              className="rounded-md"
            >
              Mark Load Out
            </Button>
            <Input
              type="number"
              placeholder="Temperature (°C)"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="flex-1 min-w-[150px] rounded-md"
            />
            <Input
              type="number"
              placeholder="Pressure (kg/cm²)"
              value={pressure}
              onChange={(e) => setPressure(e.target.value)}
              className="flex-1 min-w-[150px] rounded-md"
            />
            <Button
              onClick={handleMarkLoadOut}
              disabled={saving || workPlace === null}
              className="rounded-md bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </div>

        {/* Entries Table */}
        <div className="mt-8 bg-card border border-border rounded-lg overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Date</th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Shift</th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Size</th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Product</th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Qty</th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Load In</th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Load Out</th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Temp (°C)</th>
                  <th className="border border-border px-3 py-2 text-center text-sm font-semibold">Pressure</th>
                </tr>
              </thead>
              <tbody>
                {loadingEntries ? (
                  <tr>
                    <td colSpan={9} className="border border-border px-3 py-4 text-center text-sm text-muted-foreground">
                      Loading entries...
                    </td>
                  </tr>
                ) : entries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="border border-border px-3 py-4 text-center text-sm text-muted-foreground">
                      No entries yet. Save an entry to see it here.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-accent/5"}>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.date}</td>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.shift}</td>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.size}</td>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.product}</td>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.qty}</td>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.loadIn}</td>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.loadOut}</td>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.temp}</td>
                      <td className="border border-border px-3 py-2 text-center text-sm">{entry.pressure}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
