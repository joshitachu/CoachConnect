from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List

class FoodIntakeCreate(BaseModel):
    user_id: int = Field(..., description="User ID")
    product_name: str = Field(..., description="Name of the product")
    carbs: float = Field(..., ge=0, description="Carbohydrates in grams")
    protein: float = Field(..., ge=0, description="Protein in grams")
    fat: float = Field(..., ge=0, description="Fat in grams")
    quantity_grams: float = Field(..., gt=0, description="Quantity consumed in grams")
    intake_date: date = Field(default_factory=date.today, description="Date of intake")

class FoodIntakeFromBarcode(BaseModel):
    user_id: int = Field(..., description="User ID")
    barcode: str = Field(..., description="Product barcode")
    quantity_grams: float = Field(..., gt=0, description="Quantity consumed in grams")
    intake_date: date = Field(default_factory=date.today, description="Date of intake")

class FoodIntakeResponse(BaseModel):
    id: int
    user_id: int
    product_name: str
    carbs: float
    protein: float
    fat: float
    quantity_grams: float
    intake_date: date
    calories: float

class FoodIntakeUpdate(BaseModel):
    product_name: Optional[str] = None
    carbs: Optional[float] = Field(None, ge=0)
    protein: Optional[float] = Field(None, ge=0)
    fat: Optional[float] = Field(None, ge=0)
    quantity_grams: Optional[float] = Field(None, gt=0)
    intake_date: Optional[date] = None

class DailySummary(BaseModel):
    date: date
    total_carbs: float
    total_protein: float
    total_fat: float
    total_calories: float
    total_quantity_grams: float
    meal_count: int
    meals: List[FoodIntakeResponse]