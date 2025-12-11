from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date
from typing import List, Optional, Dict
from decimal import Decimal

def calculate_calories(carbs: float, protein: float, fat: float) -> float:
    """Calculate total calories from macronutrients"""
    return round((carbs * 4) + (protein * 4) + (fat * 9), 2)

def insert_food_intake(
    db: Session,
    user_id: int,
    product_name: str,
    carbs: float,
    protein: float,
    fat: float,
    quantity_grams: float,
    intake_date: date
) -> Dict:
    """
    Insert a new food intake record into the database.
    If a record exists for the same user, date, and product, it adds to existing values.
    """
    query = text("""
        INSERT INTO daily_food_intake 
        (user_id, product_name, carbs, protein, fat, quantity_grams, intake_date)
        VALUES (:user_id, :product_name, :carbs, :protein, :fat, :quantity_grams, :intake_date)
        ON CONFLICT (user_id, intake_date, product_name) 
        DO UPDATE SET 
            carbs = daily_food_intake.carbs + EXCLUDED.carbs,
            protein = daily_food_intake.protein + EXCLUDED.protein,
            fat = daily_food_intake.fat + EXCLUDED.fat,
            quantity_grams = daily_food_intake.quantity_grams + EXCLUDED.quantity_grams
        RETURNING id, user_id, product_name, carbs, protein, fat, quantity_grams, intake_date
    """)
    
    result = db.execute(query, {
        'user_id': user_id,
        'product_name': product_name,
        'carbs': carbs,
        'protein': protein,
        'fat': fat,
        'quantity_grams': quantity_grams,
        'intake_date': intake_date
    })
    
    row = result.fetchone()
    db.commit()
    
    if row:
        return {
            'id': row[0],
            'user_id': row[1],
            'product_name': row[2],
            'carbs': float(row[3]),
            'protein': float(row[4]),
            'fat': float(row[5]),
            'quantity_grams': float(row[6]),
            'intake_date': row[7],
            'calories': calculate_calories(float(row[3]), float(row[4]), float(row[5]))
        }
    return None

def get_intake_by_date(db: Session, user_id: int, intake_date: date) -> List[Dict]:
    """Retrieve all food intake records for a user on a specific date"""
    query = text("""
        SELECT id, user_id, product_name, carbs, protein, fat, quantity_grams, intake_date
        FROM daily_food_intake
        WHERE user_id = :user_id AND intake_date = :intake_date
        ORDER BY id
    """)
    
    result = db.execute(query, {'user_id': user_id, 'intake_date': intake_date})
    rows = result.fetchall()
    
    records = []
    for row in rows:
        records.append({
            'id': row[0],
            'user_id': row[1],
            'product_name': row[2],
            'carbs': float(row[3]),
            'protein': float(row[4]),
            'fat': float(row[5]),
            'quantity_grams': float(row[6]),
            'intake_date': row[7],
            'calories': calculate_calories(float(row[3]), float(row[4]), float(row[5]))
        })
    
    return records

def get_intake_by_date_range(
    db: Session, 
    user_id: int, 
    start_date: date, 
    end_date: date
) -> List[Dict]:
    """Retrieve all food intake records for a user within a date range"""
    query = text("""
        SELECT id, user_id, product_name, carbs, protein, fat, quantity_grams, intake_date
        FROM daily_food_intake
        WHERE user_id = :user_id AND intake_date BETWEEN :start_date AND :end_date
        ORDER BY intake_date DESC, id
    """)
    
    result = db.execute(query, {
        'user_id': user_id,
        'start_date': start_date,
        'end_date': end_date
    })
    rows = result.fetchall()
    
    records = []
    for row in rows:
        records.append({
            'id': row[0],
            'user_id': row[1],
            'product_name': row[2],
            'carbs': float(row[3]),
            'protein': float(row[4]),
            'fat': float(row[5]),
            'quantity_grams': float(row[6]),
            'intake_date': row[7],
            'calories': calculate_calories(float(row[3]), float(row[4]), float(row[5]))
        })
    
    return records

def get_daily_summary(db: Session, user_id: int, intake_date: date) -> Dict:
    """Get summary statistics for a user's food intake on a specific date"""
    query = text("""
        SELECT 
            COUNT(*) as meal_count,
            COALESCE(SUM(carbs), 0) as total_carbs,
            COALESCE(SUM(protein), 0) as total_protein,
            COALESCE(SUM(fat), 0) as total_fat,
            COALESCE(SUM(quantity_grams), 0) as total_quantity_grams
        FROM daily_food_intake
        WHERE user_id = :user_id AND intake_date = :intake_date
    """)
    
    result = db.execute(query, {'user_id': user_id, 'intake_date': intake_date})
    row = result.fetchone()
    
    if row and row[0] > 0:
        total_carbs = float(row[1])
        total_protein = float(row[2])
        total_fat = float(row[3])
        total_calories = calculate_calories(total_carbs, total_protein, total_fat)
        
        meals = get_intake_by_date(db, user_id, intake_date)
        
        return {
            'date': intake_date,
            'total_carbs': total_carbs,
            'total_protein': total_protein,
            'total_fat': total_fat,
            'total_calories': total_calories,
            'total_quantity_grams': float(row[4]),
            'meal_count': row[0],
            'meals': meals
        }
    else:
        return {
            'date': intake_date,
            'total_carbs': 0.0,
            'total_protein': 0.0,
            'total_fat': 0.0,
            'total_calories': 0.0,
            'total_quantity_grams': 0.0,
            'meal_count': 0,
            'meals': []
        }

def delete_food_intake(db: Session, record_id: int, user_id: int) -> bool:
    """Delete a specific food intake record"""
    query = text("""
        DELETE FROM daily_food_intake
        WHERE id = :record_id AND user_id = :user_id
    """)
    
    result = db.execute(query, {'record_id': record_id, 'user_id': user_id})
    db.commit()
    
    return result.rowcount > 0

def update_food_intake(
    db: Session,
    record_id: int,
    user_id: int,
    product_name: str,
    carbs: float,
    protein: float,
    fat: float,
    quantity_grams: float,
    intake_date: date
) -> Optional[Dict]:
    """Update an existing food intake record"""
    query = text("""
        UPDATE daily_food_intake
        SET product_name = :product_name,
            carbs = :carbs,
            protein = :protein,
            fat = :fat,
            quantity_grams = :quantity_grams,
            intake_date = :intake_date
        WHERE id = :record_id AND user_id = :user_id
        RETURNING id, user_id, product_name, carbs, protein, fat, quantity_grams, intake_date
    """)
    
    result = db.execute(query, {
        'product_name': product_name,
        'carbs': carbs,
        'protein': protein,
        'fat': fat,
        'quantity_grams': quantity_grams,
        'intake_date': intake_date,
        'record_id': record_id,
        'user_id': user_id
    })
    
    row = result.fetchone()
    db.commit()
    
    if row:
        return {
            'id': row[0],
            'user_id': row[1],
            'product_name': row[2],
            'carbs': float(row[3]),
            'protein': float(row[4]),
            'fat': float(row[5]),
            'quantity_grams': float(row[6]),
            'intake_date': row[7],
            'calories': calculate_calories(float(row[3]), float(row[4]), float(row[5]))
        }
    return None

def get_all_intake_for_user(db: Session, user_id: int) -> List[Dict]:
    """Get all food intake records for a specific user"""
    query = text("""
        SELECT id, user_id, product_name, carbs, protein, fat, quantity_grams, intake_date
        FROM daily_food_intake
        WHERE user_id = :user_id
        ORDER BY intake_date DESC, id
    """)
    
    result = db.execute(query, {'user_id': user_id})
    rows = result.fetchall()
    
    records = []
    for row in rows:
        records.append({
            'id': row[0],
            'user_id': row[1],
            'product_name': row[2],
            'carbs': float(row[3]),
            'protein': float(row[4]),
            'fat': float(row[5]),
            'quantity_grams': float(row[6]),
            'intake_date': row[7],
            'calories': calculate_calories(float(row[3]), float(row[4]), float(row[5]))
        })
    
    return records

def delete_all_intake_for_date(db: Session, user_id: int, intake_date: date) -> int:
    """Delete all food intake records for a user on a specific date"""
    query = text("""
        DELETE FROM daily_food_intake
        WHERE user_id = :user_id AND intake_date = :intake_date
    """)
    
    result = db.execute(query, {'user_id': user_id, 'intake_date': intake_date})
    db.commit()
    
    return result.rowcount


