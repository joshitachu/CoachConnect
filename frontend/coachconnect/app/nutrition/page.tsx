"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Trash2, ChevronLeft, ChevronRight, Calendar, Settings, RotateCcw, Star, StarOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Card } from "@/components/ui/card"
import { useUser } from "@/lib/user-context"

interface FoodIntake {
  id: number
  product_name: string
  carbs: number
  protein: number
  fat: number
  quantity_grams: number
  calories: number
  intake_date: string
  image_url?: string
}

interface DailySummary {
  date: string
  total_carbs: number
  total_protein: number
  total_fat: number
  total_calories: number
  items: FoodIntake[]
}

interface SearchResult {
  product_name: string
  image_url?: string
  nutrients: {
    carbs?: number
    protein?: number
    fat?: number
    calories?: number
  }
  quantity: number
}

interface NutritionGoals {
  calorie_goal: number
  carbs_goal: number
  protein_goal: number
  fat_goal: number
  has_custom_goals?: boolean
  updated_at?: string
}

interface FavoriteItem {
  id: string
  product_name: string
  default_quantity: number
  unit?: string
  calories?: number
  carbs?: number
  protein?: number
  fat?: number
}

export default function NutritionPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [dailyData, setDailyData] = useState<DailySummary | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedQuantity, setSelectedQuantity] = useState(100)
  const { user } = useUser()
  const USER_ID = user?.id

  const [isGoalsDialogOpen, setIsGoalsDialogOpen] = useState(false)
  const [calorieGoal, setCalorieGoal] = useState(2000)
  const [carbsGoal, setCarbsGoal] = useState(200)
  const [proteinGoal, setProteinGoal] = useState(150)
  const [fatGoal, setFatGoal] = useState(60)
  const [isSavingGoals, setIsSavingGoals] = useState(false)
  const [isLoadingGoals, setIsLoadingGoals] = useState(true)
  const [hasCustomGoals, setHasCustomGoals] = useState(false)
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false)

  const { toast } = useToast()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false)

  // Fetch user goals on mount
  useEffect(() => {
    if (USER_ID) {
      fetchUserGoals()
    }
  }, [USER_ID])

  // Fetch favorites on mount
  useEffect(() => {
    if (USER_ID) fetchFavorites()
  }, [USER_ID])

  // Fetch daily data when date or USER_ID changes
  useEffect(() => {
    if (USER_ID) {
      fetchDailyData()
    }
  }, [selectedDate, USER_ID])

  const fetchUserGoals = async () => {
    if (!USER_ID) return

    setIsLoadingGoals(true)
    try {
      const response = await fetch(`/api/nutrition/goals/${USER_ID}`)
      if (!response.ok) {
        throw new Error('Failed to fetch goals')
      }
      
      const data: NutritionGoals = await response.json()
      setCalorieGoal(data.calorie_goal)
      setCarbsGoal(data.carbs_goal)
      setProteinGoal(data.protein_goal)
      setFatGoal(data.fat_goal)
      setHasCustomGoals(data.has_custom_goals || false)
    } catch (error) {
      console.error("Failed to fetch user goals:", error)
      // Set defaults on error
      setCalorieGoal(2000)
      setCarbsGoal(200)
      setProteinGoal(150)
      setFatGoal(60)
      setHasCustomGoals(false)
    } finally {
      setIsLoadingGoals(false)
    }
  }

  const saveUserGoals = async () => {
    if (!USER_ID) {
      toast({ title: 'User ID not found. Please log in.', variant: 'destructive' })
      return
    }

    setIsSavingGoals(true)
    try {
      const response = await fetch('/api/nutrition/goals/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID.toString(),
          calorie_goal: calorieGoal,
          carbs_goal: carbsGoal,
          protein_goal: proteinGoal,
          fat_goal: fatGoal,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save goals')
      }

      const data = await response.json()
      console.log('Goals saved:', data)
      setHasCustomGoals(true)
      setIsGoalsDialogOpen(false)
      
      // Show success message
      toast({ title: 'Goals saved successfully!' })
    } catch (error) {
      console.error("Failed to save goals:", error)
      toast({ title: 'Failed to save goals. Please try again.', variant: 'destructive' })
    } finally {
      setIsSavingGoals(false)
    }
  }

  const resetUserGoals = async () => {
    if (!USER_ID) {
      toast({ title: 'User ID not found. Please log in.', variant: 'destructive' })
      return
    }
    // open confirmation dialog instead of native confirm()
    setIsResetConfirmOpen(true)
  }

  const performResetUserGoals = async () => {
    if (!USER_ID) return
    setIsResetConfirmOpen(false)

    try {
      const response = await fetch(`/api/nutrition/goals/${USER_ID}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to reset goals')

      await response.json()

      // Update state with default goals
      setCalorieGoal(2000)
      setCarbsGoal(200)
      setProteinGoal(150)
      setFatGoal(60)
      setHasCustomGoals(false)

      toast({ title: 'Goals reset to defaults successfully!' })
    } catch (error) {
      console.error('Failed to reset goals:', error)
      toast({ title: 'Failed to reset goals. Please try again.', variant: 'destructive' })
    }
  }

  const fetchDailyData = async () => {
    const dateStr = selectedDate.toISOString().split("T")[0]
    try {
      if (!USER_ID) {
        setDailyData(null)
        return
      }

      const response = await fetch(`/api/nutrition/intake/daily/${USER_ID}?intake_date=${dateStr}`)
      const data = await response.json()
      setDailyData(data)
    } catch (error) {
      console.error("Failed to fetch daily data:", error)
    }
  }

  const fetchFavorites = async () => {
    if (!USER_ID) return
    setIsLoadingFavorites(true)
    try {
      const response = await fetch(`/api/nutrition/favorites/${USER_ID}`)
      if (!response.ok) throw new Error('Failed to fetch favorites')
      const data = await response.json()
      setFavorites(data.favorites || [])
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
      setFavorites([])
    } finally {
      setIsLoadingFavorites(false)
    }
  }

  const searchFoods = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `/api/nutrition/search?query=${encodeURIComponent(searchQuery)}&quantity=${selectedQuantity}`,
      )
      const data = await response.json()
      setSearchResults(data.products || [])
    } catch (error) {
      console.error("Search failed:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const addFoodIntake = async (food: SearchResult) => {
    const dateStr = selectedDate.toISOString().split("T")[0]
    const calories = food.nutrients?.calories || 0
    const carbs = food.nutrients?.carbs || 0
    const protein = food.nutrients?.protein || 0
    const fat = food.nutrients?.fat || 0

    try {
      if (!USER_ID) {
        console.error("Cannot add food intake: USER_ID is undefined")
        return
      }
      await fetch(`/api/nutrition/intake/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          product_name: food.product_name,
          quantity: food.quantity,
          unit: "g",
          calories,
          carbs,
          protein,
          fat,
          intake_date: dateStr,
          image_url: food.image_url,
        }),
      })

      setIsAddDialogOpen(false)
      setSearchQuery("")
      setSearchResults([])
      fetchDailyData()
    } catch (error) {
      console.error("Failed to add food:", error)
    }
  }

  const addFavoriteToIntake = async (fav: FavoriteItem) => {
    const dateStr = selectedDate.toISOString().split("T")[0]
    try {
      if (!USER_ID) {
        console.error("Cannot add favorite to intake: USER_ID is undefined")
        return
      }

      await fetch(`/api/nutrition/intake/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: USER_ID,
          product_name: fav.product_name,
          quantity: fav.default_quantity,
          unit: fav.unit || "g",
          calories: fav.calories || 0,
          carbs: fav.carbs || 0,
          protein: fav.protein || 0,
          fat: fav.fat || 0,
          intake_date: dateStr,
        }),
      })

      fetchDailyData()
      toast({ title: `${fav.product_name} added to your intake.` })
    } catch (error) {
      console.error("Failed to add favorite to intake:", error)
      toast({ title: 'Failed to add favorite to intake. Please try again.', variant: 'destructive' })
    }
  }

  const addFavorite = async (food: SearchResult) => {
    if (!USER_ID) {
      console.error('Cannot add favorite: USER_ID is undefined')
      return
    }

    try {
      const response = await fetch('/api/nutrition/favorites/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID.toString(),
          product_name: food.product_name,
          default_quantity: food.quantity,
          unit: 'g',
          calories: food.nutrients?.calories || 0,
          carbs: food.nutrients?.carbs || 0,
          protein: food.nutrients?.protein || 0,
          fat: food.nutrients?.fat || 0,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add favorite')
      }

      const data = await response.json()
      // refresh favorites
      fetchFavorites()
    } catch (error) {
      console.error('Failed to add favorite:', error)
      toast({ title: 'Failed to add favorite. Please try again.', variant: 'destructive' })
    }
  }

  const deleteFavorite = async (favoriteId: string) => {
    if (!USER_ID) return
    try {
      const response = await fetch(`/api/nutrition/favorites/delete/${favoriteId}?user_id=${USER_ID}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete favorite')
      fetchFavorites()
    } catch (error) {
      console.error('Failed to delete favorite:', error)
      toast({ title: 'Failed to remove favorite. Please try again.', variant: 'destructive' })
    }
  }

  const deleteFoodIntake = async (id: number) => {
    try {
      await fetch(`/api/nutrition/intake/delete/${id}`, { method: "DELETE" })
      fetchDailyData()
    } catch (error) {
      console.error("Failed to delete food:", error)
    }
  }

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const totalCalories = dailyData?.total_calories || 0
  const caloriesRemaining = calorieGoal - totalCalories
  const caloriesOver = Math.max(totalCalories - calorieGoal, 0)
  const caloriesEaten = totalCalories
  const caloriesProgress = Math.min((caloriesEaten / calorieGoal) * 100, 100)

  const totalCarbs = dailyData?.total_carbs || 0
  const carbsProgress = Math.min((totalCarbs / carbsGoal) * 100, 100)
  const carbsLeft = Math.max(carbsGoal - totalCarbs, 0)
  const carbsOver = Math.max(totalCarbs - carbsGoal, 0)

  const totalProtein = dailyData?.total_protein || 0
  const proteinProgress = Math.min((totalProtein / proteinGoal) * 100, 100)
  const proteinLeft = Math.max(proteinGoal - totalProtein, 0)
  const proteinOver = Math.max(totalProtein - proteinGoal, 0)

  const totalFat = dailyData?.total_fat || 0
  const fatProgress = Math.min((totalFat / fatGoal) * 100, 100)
  const fatLeft = Math.max(fatGoal - totalFat, 0)
  const fatOver = Math.max(totalFat - fatGoal, 0)

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Date Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeDate(-1)}
              className="text-[color:var(--color-primary)] hover:brightness-90 hover:bg-[color:var(--color-card)]/40"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-[color:var(--color-primary)]" />
              <h1 className="text-3xl font-bold">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h1>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => changeDate(1)}
              className="text-[color:var(--color-primary)] hover:brightness-90 hover:bg-[color:var(--color-card)]/40"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex gap-2">
            <Dialog open={isGoalsDialogOpen} onOpenChange={setIsGoalsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-[color:var(--color-border)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-card)]/50 bg-transparent"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Goals
                  {hasCustomGoals && (
                    <span className="ml-2 text-xs bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)] px-2 py-0.5 rounded-full">
                      Custom
                    </span>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[color:var(--color-popover)] border-[color:var(--color-border)] text-[color:var(--color-popover-foreground)]">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-[color:var(--color-primary-foreground)]">
                    Edit Nutrition Goals
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {isLoadingGoals ? (
                    <p className="text-center text-[color:var(--color-muted-foreground)]">Loading goals...</p>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-[color:var(--color-foreground)]">Calories</label>
                        <Input
                          type="number"
                          value={calorieGoal}
                          onChange={(e) => setCalorieGoal(Number(e.target.value))}
                          className="bg-[color:var(--color-input)] border-[color:var(--color-border)] text-[color:var(--color-foreground)] mt-1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[color:var(--color-foreground)]">Carbs (g)</label>
                        <Input
                          type="number"
                          value={carbsGoal}
                          onChange={(e) => setCarbsGoal(Number(e.target.value))}
                          className="bg-[color:var(--color-input)] border-[color:var(--color-border)] text-[color:var(--color-foreground)] mt-1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[color:var(--color-foreground)]">Protein (g)</label>
                        <Input
                          type="number"
                          value={proteinGoal}
                          onChange={(e) => setProteinGoal(Number(e.target.value))}
                          className="bg-[color:var(--color-input)] border-[color:var(--color-border)] text-[color:var(--color-foreground)] mt-1"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[color:var(--color-foreground)]">Fat (g)</label>
                        <Input
                          type="number"
                          value={fatGoal}
                          onChange={(e) => setFatGoal(Number(e.target.value))}
                          className="bg-[color:var(--color-input)] border-[color:var(--color-border)] text-[color:var(--color-foreground)] mt-1"
                          min="0"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={saveUserGoals}
                          disabled={isSavingGoals}
                          className="flex-1 bg-[color:var(--color-accent)] hover:brightness-90 text-[color:var(--color-accent-foreground)]"
                        >
                          {isSavingGoals ? 'Saving...' : 'Save Goals'}
                        </Button>
                        {hasCustomGoals && (
                          <Button
                            onClick={resetUserGoals}
                            variant="outline"
                            className="border-[color:var(--color-border)] text-[color:var(--color-destructive)] hover:bg-[color:var(--color-destructive)]/10"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {hasCustomGoals && (
                        <p className="text-xs text-[color:var(--color-muted-foreground)] text-center">
                          Click the reset button to restore default goals
                        </p>
                      )}
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Reset confirmation dialog (replaces native confirm) */}
            <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
              <DialogContent className="bg-[color:var(--color-popover)] border-[color:var(--color-border)] text-[color:var(--color-popover-foreground)] max-w-lg">
                <DialogHeader>
                  <DialogTitle className="text-lg text-[color:var(--color-primary-foreground)]">Reset Nutrition Goals</DialogTitle>
                </DialogHeader>
                <div className="mt-2 text-sm text-[color:var(--color-muted-foreground)]">
                  Are you sure you want to reset your goals to the default values? This action cannot be undone.
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsResetConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={performResetUserGoals} className="bg-[color:var(--color-destructive)] text-[color:var(--color-destructive-foreground)]">
                    Reset Goals
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              onClick={() => setSelectedDate(new Date())}
              variant="outline"
              className="border-[color:var(--color-border)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-card)]/50"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Calorie Overview */}
        <Card className="bg-[color:var(--color-card)]/40 border-[color:var(--color-border)] p-6 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[color:var(--color-primary-foreground)]">
                {caloriesRemaining >= 0 ? (
                  <>
                    You can still eat{" "}
                    <span className="text-[color:var(--color-chart-1)] font-bold">{Math.round(caloriesRemaining)}</span>{" "}
                    calories
                  </>
                ) : (
                  <>
                    You've reached your goal —{" "}
                    <span className="text-[color:var(--color-chart-1)] font-bold">{Math.round(caloriesOver)}</span>{" "}
                    calories over
                  </>
                )}
              </h2>
            </div>

            <div className="relative h-3 bg-[color:var(--color-card)] rounded-full overflow-hidden">
              <div
                className="absolute h-full transition-all duration-500"
                style={{
                  width: `${caloriesProgress}%`,
                  background: "linear-gradient(90deg, hsl(var(--chart-1)), hsl(var(--chart-2)))",
                }}
              />
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-[color:var(--color-chart-1)]">
                {Math.round(caloriesEaten)} calories eaten
                {caloriesOver > 0 ? ` — ${Math.round(caloriesOver)} over` : ""}
              </span>
              <span className="text-[color:var(--color-primary)]">Goal: {calorieGoal}</span>
            </div>
          </div>
        </Card>

        {/* Macro Circles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Carbs Circle */}
          <Card className="bg-[color:var(--color-card)]/40 border-[color:var(--color-border)] p-8 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth="16"
                    fill="none"
                    opacity="0.2"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - carbsProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-[color:var(--color-chart-1)]">
                    {Math.round(carbsProgress)}
                    <span className="text-2xl">%</span>
                  </div>
                  <div className="text-[color:var(--color-chart-1)] text-lg mt-1">Carbs</div>
                </div>
              </div>
              <p className="text-[color:var(--color-chart-1)] mt-4 text-lg">
                {carbsOver > 0 ? `${Math.round(carbsOver)}g over` : `${Math.round(carbsLeft)}g left`}
              </p>
            </div>
          </Card>

          {/* Protein Circle */}
          <Card className="bg-[color:var(--color-card)]/40 border-[color:var(--color-border)] p-8 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth="16"
                    fill="none"
                    opacity="0.2"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - proteinProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-[color:var(--color-chart-2)]">
                    {Math.round(proteinProgress)}
                    <span className="text-2xl">%</span>
                  </div>
                  <div className="text-[color:var(--color-chart-2)] text-lg mt-1">Protein</div>
                </div>
              </div>
              <p className="text-[color:var(--color-chart-2)] mt-4 text-lg">
                {proteinOver > 0 ? `${Math.round(proteinOver)}g over` : `${Math.round(proteinLeft)}g left`}
              </p>
            </div>
          </Card>

          {/* Fat Circle */}
          <Card className="bg-[color:var(--color-card)]/40 border-[color:var(--color-border)] p-8 backdrop-blur-sm">
            <div className="flex flex-col items-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth="16"
                    fill="none"
                    opacity="0.2"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - fatProgress / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold text-[color:var(--color-chart-3)]">
                    {Math.round(fatProgress)}
                    <span className="text-2xl">%</span>
                  </div>
                  <div className="text-[color:var(--color-chart-3)] text-lg mt-1">Fat</div>
                </div>
              </div>
              <p className="text-[color:var(--color-chart-3)] mt-4 text-lg">
                {fatOver > 0 ? `${Math.round(fatOver)}g over` : `${Math.round(fatLeft)}g left`}
              </p>
            </div>
          </Card>
        </div>

        {/* Favorites Section */}
        <Card className="bg-[color:var(--color-card)]/40 border-[color:var(--color-border)] p-6 backdrop-blur-sm">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-[color:var(--color-primary-foreground)]">Favorites</h2>
            </div>

            {isLoadingFavorites ? (
              <p className="text-[color:var(--color-muted-foreground)]">Loading favorites...</p>
            ) : favorites.length > 0 ? (
              <div className="space-y-2">
                {favorites.map((fav) => (
                  <Card key={fav.id} className="bg-[color:var(--color-card)]/60 border-[color:var(--color-border)] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-[color:var(--color-primary-foreground)]">{fav.product_name}</div>
                        <div className="text-xs text-[color:var(--color-muted-foreground)]">{fav.default_quantity}{fav.unit ? ` ${fav.unit}` : ' g'}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => addFavoriteToIntake(fav)} className="bg-[color:var(--color-accent)] text-[color:var(--color-accent-foreground)]">
                          Add
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => deleteFavorite(fav.id)} className="text-[color:var(--color-destructive)]">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-[color:var(--color-muted-foreground)]">No favorites yet. Mark search results with the star to save favorites.</p>
            )}
          </div>
        </Card>

        {/* Meals Section */}
        <Card className="bg-[color:var(--color-card)]/40 border-[color:var(--color-border)] backdrop-blur-sm">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[color:var(--color-primary-foreground)]">Today's Meals</h2>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[color:var(--color-accent)] hover:brightness-90 text-[color:var(--color-accent-foreground)]">
                    <Plus className="h-5 w-5 mr-2" />
                    Add Food
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[color:var(--color-popover)] border-[color:var(--color-border)] text-[color:var(--color-popover-foreground)] max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-[color:var(--color-primary-foreground)]">
                      Search and Add Food
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 mt-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Search for food..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && searchFoods()}
                        className="bg-[color:var(--color-input)] border-[color:var(--color-border)] text-[color:var(--color-foreground)] placeholder:[color:var(--color-muted-foreground)]"
                      />
                      <Input
                        type="number"
                        placeholder="Quantity (g)"
                        value={selectedQuantity}
                        onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                        className="bg-[color:var(--color-input)] border-[color:var(--color-border)] text-[color:var(--color-foreground)] w-32"
                      />
                      <Button
                        onClick={searchFoods}
                        disabled={isSearching}
                        className="bg-[color:var(--color-primary)] hover:brightness-95 text-[color:var(--color-primary-foreground)]"
                      >
                        <Search className="h-5 w-5" />
                      </Button>
                    </div>

                    {isSearching && (
                      <p className="text-center text-[color:var(--color-muted-foreground)]">Searching...</p>
                    )}

                    <div className="space-y-2">
                      {searchResults.map((food, index) => {
                        const calories = Math.round(food.nutrients?.calories || 0)
                        const carbs = Math.round(food.nutrients?.carbs || 0)
                        const protein = Math.round(food.nutrients?.protein || 0)
                        const fat = Math.round(food.nutrients?.fat || 0)

                        return (
                          <Card
                            key={index}
                            className="bg-[color:var(--color-card)]/60 border-[color:var(--color-border)] p-4"
                          >
                            <div className="flex gap-4 items-center">
                              {food.image_url ? (
                                <img
                                  src={food.image_url}
                                  alt={food.product_name}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                              ) : (
                                <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-transparent" />
                              )}
                                <div className="flex-1 flex justify-between items-center">
                                <div>
                                  <h3 className="font-semibold text-[color:var(--color-primary-foreground)]">
                                    {food.product_name}
                                  </h3>
                                  <p className="text-sm text-[color:var(--color-muted-foreground)]">
                                    {calories} kcal • {food.quantity}g
                                  </p>
                                  <p className="text-xs text-[color:var(--color-muted-foreground)] mt-1">
                                    Carbs: {carbs}g • Protein: {protein}g • Fat: {fat}g
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* Favorite toggle */}
                                  {favorites.find((f) => f.product_name === food.product_name) ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const fav = favorites.find((f) => f.product_name === food.product_name)
                                        if (fav) deleteFavorite(fav.id)
                                      }}
                                      className="text-[color:var(--color-accent)]"
                                    >
                                      <Star className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => addFavorite(food)}
                                      className="text-[color:var(--color-muted-foreground)]"
                                    >
                                      <StarOff className="h-4 w-4" />
                                    </Button>
                                  )}

                                  <Button
                                    onClick={() => addFoodIntake(food)}
                                    size="sm"
                                    className="bg-[color:var(--color-accent)] hover:brightness-90 text-[color:var(--color-accent-foreground)]"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {dailyData?.items && dailyData.items.length > 0 ? (
                dailyData.items.map((item) => (
                  <Card
                    key={item.id}
                    className="bg-[color:var(--color-card)]/60 border-[color:var(--color-border)] p-4 hover:shadow-md transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg flex-shrink-0 bg-transparent" />
                      )}

                      <div className="flex-1">
                        <h3 className="font-semibold text-[color:var(--color-card-foreground)]">{item.product_name}</h3>
                        <p className="text-sm text-[color:var(--color-muted-foreground)]">
                          {Math.round(item.calories)} kcal • {item.quantity_grams}g
                        </p>
                      </div>

                      <div className="text-sm text-[color:var(--color-muted-foreground)] text-right hidden md:block">
                        <span className="text-[color:var(--color-chart-1)]">C: {Math.round(item.carbs)}g</span>
                        {" • "}
                        <span className="text-[color:var(--color-chart-2)]">P: {Math.round(item.protein)}g</span>
                        {" • "}
                        <span className="text-[color:var(--color-chart-3)]">F: {Math.round(item.fat)}g</span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteFoodIntake(item.id)}
                        className="text-[color:var(--color-destructive)] hover:brightness-90"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 text-[color:var(--color-muted-foreground)]">
                  <p className="text-lg">No meals logged yet today</p>
                  <p className="text-sm mt-2">Click "Add Food" to start tracking</p>
                </div>
              )}
            </div>

            {dailyData?.items && dailyData.items.length > 0 && (
              <div className="mt-6 pt-4 border-t border-[color:var(--color-border)]/50">
                <div className="flex justify-between text-sm">
                  <span className="text-[color:var(--color-primary)] font-semibold">Total</span>
                  <span className="text-[color:var(--color-chart-1)] font-bold">
                    {Math.round(dailyData.total_calories)} kcal
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}