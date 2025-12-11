# ==================== FILE 1: database.py ====================
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from contextlib import contextmanager

from DB.db import insert_food_intake, get_daily_summary, get_intake_by_date_range, delete_food_intake, update_food_intake, delete_all_intake_for_date


# ==================== FILE 4: main.py ====================
from fastapi import FastAPI, HTTPException, Query, Depends
from typing import Optional, List
from datetime import date, datetime, timedelta
import requests
from sqlalchemy.orm import Session

# Import from our modules
from models import (
    FoodIntakeCreate, 
    FoodIntakeFromBarcode, 
    FoodIntakeResponse,
    DailySummary
)
import food_intake_crud as crud

# Base URL for Open Food Facts API
BASE_URL = 'https://world.openfoodfacts.org/api/v2'
BASE_URL_V0 = 'https://world.openfoodfacts.org'

# Initialize FastAPI app
app = FastAPI(
    title="Open Food Facts API with Food Intake Tracking",
    version="2.0.0",
    description="API wrapper for Open Food Facts with daily food intake tracking"
)

# ==================== HELPER FUNCTIONS ====================

def search_products(query: str, page_size: int = 25, page: int = 1):
    """Search for products using Open Food Facts API"""
    params = {
        'search_terms': query,
        'page_size': page_size,
        'page': page,
        'json': 1
    }
    
    response = requests.get(f"{BASE_URL}/search", params=params)
    
    if response.status_code == 200:
        data = response.json()
        return data.get('products', []), data.get('count', 0)
    else:
        raise HTTPException(
            status_code=response.status_code,
            detail="Error fetching data from Open Food Facts"
        )

def get_product_by_barcode(barcode: str):
    """Get detailed product information by barcode"""
    response = requests.get(f"{BASE_URL}/product/{barcode}")
    
    if response.status_code == 200:
        data = response.json()
        if data.get('status') == 1:
            return data.get('product')
        else:
            raise HTTPException(status_code=404, detail=f"Product with barcode {barcode} not found")
    else:
        raise HTTPException(
            status_code=response.status_code,
            detail="Error fetching data from Open Food Facts"
        )

def adjust_nutrients_by_quantity(nutriments: dict, quantity_grams: float):
    """Adjust nutrient values based on quantity"""
    if not nutriments:
        return {}
    
    adjusted = {}
    multiplier = quantity_grams / 100
    
    nutrient_keys = [
        'energy-kcal', 'energy-kj', 'fat', 'saturated-fat', 
        'carbohydrates', 'sugars', 'fiber', 'proteins', 
        'salt', 'sodium', 'alcohol', 'vitamin-a', 'vitamin-c',
        'calcium', 'iron', 'fruits-vegetables-nuts'
    ]
    
    for key in nutrient_keys:
        full_key = f"{key}_100g"
        if full_key in nutriments:
            adjusted[key] = round(nutriments[full_key] * multiplier, 2)
            adjusted[f"{key}_100g"] = nutriments[full_key]
    
    return adjusted

def format_product(product: dict, quantity_grams: Optional[float] = None):
    """Format a product for consistent output"""
    if not product:
        return None
    
    nutriments = product.get('nutriments', {})
    
    if quantity_grams and quantity_grams != 100:
        adjusted_nutrients = adjust_nutrients_by_quantity(nutriments, quantity_grams)
    else:
        adjusted_nutrients = nutriments
        quantity_grams = 100
    
    return {
        "code": product.get('code'),
        "product_name": product.get('product_name'),
        "brands": product.get('brands'),
        "categories": product.get('categories'),
        "quantity": product.get('quantity'),
        "serving_size": product.get('serving_size'),
        "packaging": product.get('packaging'),
        "ingredients_text": product.get('ingredients_text'),
        "allergens": product.get('allergens'),
        "traces": product.get('traces'),
        "labels": product.get('labels'),
        "countries": product.get('countries'),
        "nutriscore_grade": product.get('nutriscore_grade'),
        "nova_group": product.get('nova_group'),
        "ecoscore_grade": product.get('ecoscore_grade'),
        "image_url": product.get('image_url'),
        "image_front_url": product.get('image_front_url'),
        "image_nutrition_url": product.get('image_nutrition_url'),
        "nutriments": adjusted_nutrients,
        "quantity_used": quantity_grams,
        "quantity_unit": "g"
    }




@app.get("/search")
def search_foods(
    query: str = Query(..., description="Search term"),
    quantity: Optional[float] = Query(100, description="Quantity in grams"),
    page_size: int = Query(25, ge=1, le=100),
    page: int = Query(1, ge=1)
):
    """Search for products by name/keyword"""
    products, total_count = search_products(query, page_size, page)
    
    if not products:
        raise HTTPException(status_code=404, detail=f"No products found")
    
    formatted_products = [format_product(p, quantity) for p in products if p]
    
    return {
        "query": query,
        "total_count": total_count,
        "page": page,
        "page_size": page_size,
        "results_on_page": len(formatted_products),
        "quantity": quantity,
        "unit": "g",
        "products": formatted_products
    }

@app.get("/product/{barcode}")
def get_product_details(
    barcode: str,
    quantity: Optional[float] = Query(100, description="Quantity in grams")
):
    """Get detailed information about a product by barcode"""
    product = get_product_by_barcode(barcode)
    formatted = format_product(product, quantity)
    
    if not formatted:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return formatted


@app.post("/intake/add", response_model=FoodIntakeResponse)
def add_food_intake(intake: FoodIntakeCreate):
    """Add a food intake record manually"""
    try:
        result = insert_food_intake(
            user_id=intake.user_id,
            product_name=intake.product_name,
            carbs=intake.carbs,
            protein=intake.protein,
            fat=intake.fat,
            quantity_grams=intake.quantity_grams,
            intake_date=intake.intake_date
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to insert food intake")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    


@app.post("/intake/add-from-barcode", response_model=FoodIntakeResponse)
def add_food_intake_from_barcode(intake: FoodIntakeFromBarcode):
    """Add food intake by scanning a product barcode"""
    try:
        # Get product info from Open Food Facts
        product = get_product_by_barcode(intake.barcode)
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Extract and adjust nutrients
        nutriments = product.get('nutriments', {})
        adjusted_nutrients = adjust_nutrients_by_quantity(nutriments, intake.quantity_grams)
        
        # Insert into database
        result = insert_food_intake(
            user_id=intake.user_id,
            product_name=product.get('product_name', 'Unknown Product'),
            carbs=adjusted_nutrients.get('carbohydrates', 0),
            protein=adjusted_nutrients.get('proteins', 0),
            fat=adjusted_nutrients.get('fat', 0),
            quantity_grams=intake.quantity_grams,
            intake_date=intake.intake_date
        )
        
        if not result:
            raise HTTPException(status_code=500, detail="Failed to insert food intake")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


@app.get("/intake/daily/{user_id}")
def get_daily_intake(
    user_id: int,
    intake_date: Optional[date] = Query(None, description="Date (YYYY-MM-DD)")
):
    """Get daily food intake summary for a user"""
    if intake_date is None:
        intake_date = datetime.now().date()
    
    try:
        summary = get_daily_summary(user_id, intake_date)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/intake/range/{user_id}")
def get_intake_range(
    user_id: int,
    start_date: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: date = Query(..., description="End date (YYYY-MM-DD)")
):
    """Get food intake records for a date range"""
    try:
        records = get_intake_by_date_range(user_id, start_date, end_date)
        
        # Group by date
        grouped = {}
        for record in records:
            date_str = str(record['intake_date'])
            if date_str not in grouped:
                grouped[date_str] = []
            grouped[date_str].append(record)
        
        return {
            "user_id": user_id,
            "start_date": start_date,
            "end_date": end_date,
            "total_records": len(records),
            "records_by_date": grouped
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/intake/week/{user_id}")
def get_weekly_summary(
    user_id: int,
    week_date: Optional[date] = Query(None, description="Any date in the week")
):
    """Get a weekly summary of food intake (7 days)"""
    if week_date is None:
        week_date = datetime.now().date()
    
    # Calculate week start (Monday)
    start_of_week = week_date - timedelta(days=week_date.weekday())
    end_of_week = start_of_week + timedelta(days=6)
    
    try:
        weekly_data = []
        for i in range(7):
            current_date = start_of_week + timedelta(days=i)
            summary = get_daily_summary(user_id, current_date)
            weekly_data.append(summary)
        
        # Calculate weekly totals
        total_carbs = sum(day['total_carbs'] for day in weekly_data)
        total_protein = sum(day['total_protein'] for day in weekly_data)
        total_fat = sum(day['total_fat'] for day in weekly_data)
        total_calories = sum(day['total_calories'] for day in weekly_data)
        
        return {
            "user_id": user_id,
            "week_start": start_of_week,
            "week_end": end_of_week,
            "weekly_totals": {
                "total_carbs": round(total_carbs, 2),
                "total_protein": round(total_protein, 2),
                "total_fat": round(total_fat, 2),
                "total_calories": round(total_calories, 2),
                "daily_average_calories": round(total_calories / 7, 2)
            },
            "daily_breakdown": weekly_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")



@app.put("/intake/update/{record_id}", response_model=FoodIntakeResponse)
def update_intake_record(
    record_id: int,
    intake: FoodIntakeCreate
):
    """Update an existing food intake record"""
    try:
        result = update_food_intake(
            record_id=record_id,
            user_id=intake.user_id,
            product_name=intake.product_name,
            carbs=intake.carbs,
            protein=intake.protein,
            fat=intake.fat,
            quantity_grams=intake.quantity_grams,
            intake_date=intake.intake_date
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Record not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
