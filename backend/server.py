from fastapi import FastAPI, Request
import json
from fastapi.responses import JSONResponse
import requests
from typing import Dict, Any
from sqlalchemy import create_engine, text
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, Body

from sqlalchemy import create_engine, text, bindparam
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB
from dotenv import load_dotenv
import os
import json
import random
import string
from typing import Optional, Dict, Any, List
from contextlib import contextmanager
from datetime import date

from DB.db import insert_onboarding_form_for_trainer_email, check_login, check_login_client ,create_account, show_form, resave, changeTrainerscode, fetch_trainer_code, client_check_trainer, get_forms_for_trainer_code, linktrainercode, save_form_details_client, get_client_submissions_for_trainers_code

app = FastAPI()

load_dotenv()
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://coach_user:voetbal123@192.168.1.100:5432/coachconnect",
)

@contextmanager
def get_db():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def get_db_session():
    """Dependency for FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- SQLAlchemy setup ---
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    future=True,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)



# Add these to your backend (e.g., main.py or models.py)
from pydantic import BaseModel

class NutritionGoals(BaseModel):
    calorie_goal: int
    carbs_goal: int
    protein_goal: int
    fat_goal: int

class UpdateGoalsRequest(BaseModel):
    user_id: str
    calorie_goal: int
    carbs_goal: int
    protein_goal: int
    fat_goal: int

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}


@app.post('/form-resave')
def save_form(form_data: Dict[str, Any]):
    print("Received form data:", form_data)
    form_id = form_data["formSchema"]

    if(form_id):
        resave(form_data)
        return {"message": "Form saved successfully", "form_data": form_data}

    else:
        return {"error": "Form ID not provided"}, 400



@app.post("/api/forms")
async def get_forms(request: Request):
    print("Received request for forms")
    
    # Extract JSON data from frontend
    data = await request.json()
    print("Received data:", data)
    
    # Extract user email from the form data (if available)
    user_email = data.get("userEmail", None)
    print("User email:", user_email)
    if user_email:
        # Process form data with user email
        insert_onboarding_form_for_trainer_email(user_email, data)
    else:
        return {"error": "User email not provided"}, 400
    
    return {"message": "Form received successfully", "data": data}


form = {
    "id": "form-1759307521509",
    "name": "joshuas form",
    "description": "test form",
    "fields": [
        {
            "id": "field-1759307528323",
            "type": "text",
            "label": "text",
            "placeholder": "",
            "required": False,
            "validation": [],
            "visibilityRules": []
        },
        {
            "id": "field-1759307533090",
            "type": "email",
            "label": "email field",
            "placeholder": "",
            "required": False,
            "validation": [],
            "visibilityRules": []
        },
        {
            "id": "field-1759307537773",
            "type": "number",
            "label": "number",
            "placeholder": "",
            "required": False,
            "validation": [],
            "visibilityRules": []
        },
        {
            "id": "field-1759307543691",
            "type": "textarea",
            "label": "textarea",
            "placeholder": "",
            "required": False,
            "validation": [],
            "visibilityRules": []
        },
        {
            "id": "field-1759307549573",
            "type": "select",
            "label": "select field",
            "placeholder": "",
            "required": False,
            "options": ["Option 1", "Option 2", "Option 3"],
            "validation": [],
            "visibilityRules": []
        }
    ],
    "createdAt": "2025-10-01T08:32:01.509Z",
    "updatedAt": "2025-10-01T08:32:37.222Z"
}

@app.post('/signup')
def signup(user: dict):
    print("Received signup request:", user)
    return {"message": "Signup successful", "user": user}



from fastapi import HTTPException

@app.post('/login')
def login(credentials: dict):
    print("Received login request:", credentials)
    email = credentials.get("email")
    password = credentials.get("password")
    role = credentials.get("role")
    
    if not email or not password:
        print("Missing email or password")
        raise HTTPException(status_code=400, detail="Email and password required")
    
    if role == "trainer":
        user_data = check_login(email, password)
        if user_data:
            return {
                "success": True, 
                "message": "Login successful",
                "user": user_data
            }
        else:
            return {"success": False, "message": "Invalid credentials"}
    else:
        user_data = check_login_client(email, password)
        if user_data:
            return {
                "success": True, 
                "message": "Login successful",
                "user": user_data
            }
        else:
            return {"success": False, "message": "Invalid credentials"}




@app.post("/form-show")
def form_show(payload: dict = Body(...)):
    trainer_code = payload.get("trainer_code")
    if not trainer_code:
        raise HTTPException(status_code=422, detail="trainer_code is required")

    forms = get_forms_for_trainer_code(trainer_code)
    if not forms:
        raise HTTPException(status_code=404, detail="No forms found for this trainer")
    return {"form_schemas": forms}

db_url= "postgresql+psycopg2://coach_user:voetbal123@127.0.0.1:5432/coachconnect"
engine = create_engine(db_url, pool_pre_ping=True)



@app.post("/register")
def register_client(client_data: dict):
    print("Received client registration data:", client_data)

    role = client_data.get("role")
    if role not in {"client", "trainer"}:
        raise HTTPException(status_code=400, detail="role must be 'client' or 'trainer'")

    success = create_account(client_data, role)
    if not success:
        # In production, you might map specific DB errors to 409 (duplicate email), etc.
        raise HTTPException(status_code=500, detail=f"Could not create {role} account")

    return {"message": f"{role.capitalize()} registered successfully", "client_data": client_data}


@app.post("/saveonboardingform")
def save_onboarding_form(form_data: Dict[str, Any]):
    print("Received onboarding form data:", form_data)
    
    return {"message": "Onboarding form saved successfully", "form_data": form_data}

@app.get("/trainercode")
def get_trainer_code(code: str, email: str):
    print("Received trainer code request:")
    print(f"  Code:  {code}")
    print(f"  Email: {email}")

    code=fetch_trainer_code(email)
    print(f"Fetched trainer code for {email}: {code}")

    return {"trainer_code": code, "email": email}



@app.post("/trainerchange")
async def update_trainer_code(request: Request):
 
    try:
        data = await request.json()
        code = data.get("code")
        email = data.get("email")
        print("Received data for trainer code change:", data)

        if not code or not email:
            return {"error": "Both 'code' and 'email' are required"}
        
        changeTrainerscode(data)

        # Convert to uppercase / lowercase for consistency
        code = code.upper()
        email = email.lower()

        print(f"Trainer code change request received:")
        print(f"  Code:  {code}")
        print(f"  Email: {email}")

        return {
            "success": True,
            "message": f"Trainer code {code} linked to user {email}",
            "trainer_code": code,
            "email": email,
        }

    except Exception as e:
        print("Error handling trainer change:", e)
        return {"error": "Failed to process request", "details": str(e)}
    
@app.get("/client/check-trainer")
def check_trainer_association(client_email: str, trainer_code: Optional[str] = None):
    print("Received check trainer association request:")
    print(f"  Client Email: {client_email}")
    print(f"  Trainer Code: {trainer_code}")

    result = client_check_trainer(client_email)  # returns {"has_trainer": bool, "trainers": [...]}
    print("Check result:", result)

    has_trainer = result.get("has_trainer", False)
    trainers = result.get("trainers", [])
    
    # Transform trainers to match frontend interface
    formatted_trainers = []
    for trainer in trainers:
        formatted_trainers.append({
            "id": trainer.get("id"),  # Make sure your client_check_trainer includes this
            "first_name": trainer.get("first_name"),
            "last_name": trainer.get("last_name"),
            "email": trainer.get("email"),  # Make sure your client_check_trainer includes this
            "trainer_code": trainer.get("code")  # Map 'code' to 'trainer_code'
        })
    
    print("Formatted trainers:", formatted_trainers)
    
    trainer_info = formatted_trainers[0] if formatted_trainers else None

    return {
        "client_email": 'joshuakabel100@gmail.com',
        "has_trainer": has_trainer,
        "trainers": formatted_trainers,  # Return formatted trainers
        "trainer": trainer_info,
        "trainer_code": trainer_info["trainer_code"] if trainer_info else None,
        "is_associated": has_trainer,
    }

@app.post("/client/link-trainer")
def link_trainer(payload: dict = Body(...)):
    client_email = payload.get("client_email")
    trainer_code = payload.get("trainer_code")

    if not client_email or not trainer_code:
        return {"success": False, "message": "client_email and trainer_code are required"}

    trainer_code = trainer_code.strip().upper()

    try:
        # 🔹 call your linking function
        result = linktrainercode(client_email, trainer_code)
    except Exception as e:
        print("Error linking trainer:", e)
        return {"success": False, "message": "Server error while linking trainer"}

    # ✅ normalize result
    if not result:
        return {"success": False, "message": "Invalid trainer code or already linked"}

    # if your linktrainercode returns a trainer dict:
    if isinstance(result, dict):
        return {
            "success": True,
            "message": "Successfully linked with trainer",
            "trainer": result,
        }

    # fallback if it just returns True or ID
    return {
        "success": True,
        "message": "Successfully linked with trainer",
        "trainer": {"trainer_code": trainer_code},
    }



@app.get('/api/formshowfortrainer')
def get_form(request: Request):
    # Get the email from the query parameters
    email = request.query_params.get("email")

    if not email:
        raise HTTPException(status_code=422, detail="Email is required")
    
    print(f"Received request for form with email: {email}")
    
    # Simulate fetching form schemas based on the email
    form_schemas = show_form(email)  # This function should return form data for the given email
    print(f"Fetched form schemas: {form_schemas}")
    
    if form_schemas:
        return {"form_schemas": form_schemas}
    else:
        raise HTTPException(status_code=404, detail="No forms found for the given email")


@app.get('/api/form-submissions')
def form_submissions(trainers_code: Optional[str] = None, email: Optional[str] = None):
    """
    Return client submissions visible to a trainer.
    Provide either `trainers_code` or `email` (trainer email) as query parameter.
    """
    # Resolve trainers_code from email if provided
    if not trainers_code and email:
        trainers_code = fetch_trainer_code(email)

    if not trainers_code:
        raise HTTPException(status_code=422, detail="trainers_code or trainer email is required")

    try:
        submissions = get_client_submissions_for_trainers_code(trainers_code)
        return {"submissions": submissions}
    except Exception as e:
        print("Error fetching submissions:", e)
        raise HTTPException(status_code=500, detail="Failed to fetch submissions")


@app.post('/form-submit-client')
def submit_form_client(submission_data: Dict[str, Any]):
    """
    Handle client form submission.
    Expected payload:
    {
        "email": "client@example.com",
        "trainer_code": "P4ON0",
        "form_id": "form-1762988893132",
        "values": { "field-1762988910056": "joshua", ... }
    }
    """
    print("Received form submission data:", submission_data)
    
    # Extract required fields
    email = submission_data.get("email")
    trainer_code = submission_data.get("trainer_code")
    form_id = submission_data.get("form_id")
    values = submission_data.get("values", {})
    
    # Validate required fields
    if not email:
        return {"success": False, "detail": "Email is required"}, 400
    
    if not trainer_code:
        return {"success": False, "detail": "Trainer code is required"}, 400
    
    if not form_id:
        return {"success": False, "detail": "Form ID is required"}, 400
    
    # Save form data
    success = save_form_details_client(
        client_email=email,
        trainers_code=trainer_code,
        form_id=form_id,
        form_data=values
    )
    
    if success:
        return {
            "success": True,
            "message": "Form submitted successfully",
            "form_id": form_id
        }
    else:
        return {
            "success": False,
            "detail": "Failed to save form submission"
        }, 500




from fastapi import FastAPI, HTTPException, Query
from typing import Optional, List
import requests

from pydantic import BaseModel, Field
from datetime import date
from typing import Optional, List
from typing import Dict
import uuid
from datetime import datetime
from fastapi import FastAPI, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
import uuid
import httpx


# OpenFoodFacts API URLs
BASE_URL = 'https://world.openfoodfacts.org/api/v2'
BASE_URL_V0 = 'https://world.openfoodfacts.org'

# ==================== MODELS ====================

class AddIntakeRequest(BaseModel):
    user_id: str
    product_name: str
    quantity: float
    unit: str = "g"
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    meal_type: Optional[str] = None
    intake_date: Optional[str] = None
    intake_time: Optional[str] = None
    barcode: Optional[str] = None

class AddIntakeFromBarcodeRequest(BaseModel):
    user_id: str
    barcode: str
    quantity: float
    meal_type: Optional[str] = None
    intake_date: Optional[str] = None
    intake_time: Optional[str] = None

class UpdateIntakeRequest(BaseModel):
    quantity: Optional[float] = None
    meal_type: Optional[str] = None
    intake_date: Optional[str] = None
    intake_time: Optional[str] = None

class AddFavoriteRequest(BaseModel):
    user_id: str
    product_name: str
    default_quantity: float
    unit: str = "g"
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: Optional[float] = None
    sugar: Optional[float] = None
    sodium: Optional[float] = None
    barcode: Optional[str] = None
    notes: Optional[str] = None

class AddFavoriteFromBarcodeRequest(BaseModel):
    user_id: str
    barcode: str
    default_quantity: float
    notes: Optional[str] = None

class AddFavoriteToIntakeRequest(BaseModel):
    user_id: str
    favorite_id: str
    quantity: Optional[float] = None
    meal_type: Optional[str] = None
    intake_date: Optional[str] = None
    intake_time: Optional[str] = None

# ==================== OPENFOODFACTS HELPER FUNCTIONS ====================

async def search_products_openfoodfacts(query: str, page_size: int, page: int) -> tuple[List[Dict], int]:
    """
    Search for products using OpenFoodFacts API (CGI endpoint for better results).
    Returns (products_list, total_count)
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Use the CGI search endpoint (same as website)
            url = f"{BASE_URL_V0}/cgi/search.pl"
            params = {
                "search_terms": query,
                "search_simple": 1,
                "action": "process",
                "json": 1,
                "page": page,
                "page_size": page_size,
                "fields": "code,product_name,brands,nutriments,quantity,serving_size,image_url,categories,nutrient_levels"
            }
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            products = data.get("products", [])
            total_count = data.get("count", 0)
            
            # Format products to match our structure
            formatted_products = []
            for product in products:
                # Include all products, even with minimal nutrition data
                formatted_products.append({
                    "barcode": product.get("code"),
                    "product_name": product.get("product_name", "Unknown Product"),
                    "brands": product.get("brands", ""),
                    "quantity": product.get("quantity", ""),
                    "serving_size": product.get("serving_size", ""),
                    "image_url": product.get("image_url", ""),
                    "categories": product.get("categories", ""),
                    "nutriments": product.get("nutriments", {})
                })
            
            return formatted_products, total_count
            
        except httpx.HTTPError as e:
            print(f"Error searching OpenFoodFacts: {e}")
            return [], 0

async def get_product_by_barcode_openfoodfacts(barcode: str) -> Optional[Dict]:
    """
    Get product details by barcode from OpenFoodFacts API.
    """
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # OpenFoodFacts product endpoint
            url = f"{BASE_URL}/product/{barcode}"
            
            response = await client.get(url)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("status") != 1:
                return None
            
            product = data.get("product", {})
            
            return {
                "barcode": product.get("code"),
                "product_name": product.get("product_name", "Unknown Product"),
                "brands": product.get("brands", ""),
                "quantity": product.get("quantity", ""),
                "serving_size": product.get("serving_size", ""),
                "nutriments": product.get("nutriments", {}),
                "image_url": product.get("image_url", ""),
                "categories": product.get("categories", "")
            }
            
        except httpx.HTTPError as e:
            print(f"Error fetching product from OpenFoodFacts: {e}")
            return None

def format_product(product: Dict, quantity: float) -> Optional[Dict]:
    """
    Format product data and adjust nutrients based on quantity.
    """
    if not product or "nutriments" not in product:
        return None
    
    nutriments = product["nutriments"]
    
    # Calculate scaling factor (quantity / 100g)
    scale = quantity / 100.0
    
    def scale_nutrient(value):
        if value is None or value == "":
            return None
        try:
            return round(float(value) * scale, 2)
        except (ValueError, TypeError):
            return None
    
    def get_nutrient(key):
        """Try different variations of nutrient keys"""
        variations = [
            f"{key}_100g",
            f"{key}-100g",
            f"{key}_per_100g",
            key
        ]
        for var in variations:
            if var in nutriments:
                return nutriments[var]
        return None
    
    formatted = {
        "barcode": product.get("barcode"),
        "product_name": product.get("product_name"),
        "brands": product.get("brands"),
        "quantity": quantity,
        "unit": "g",
        "image_url": product.get("image_url"),
        "nutrients": {
            "calories": scale_nutrient(get_nutrient("energy-kcal")),
            "protein": scale_nutrient(get_nutrient("proteins")),
            "carbs": scale_nutrient(get_nutrient("carbohydrates")),
            "fat": scale_nutrient(get_nutrient("fat")),
            "fiber": scale_nutrient(get_nutrient("fiber")),
            "sugar": scale_nutrient(get_nutrient("sugars")),
            "sodium": scale_nutrient(get_nutrient("sodium")),
            "saturated_fat": scale_nutrient(get_nutrient("saturated-fat")),
            "salt": scale_nutrient(get_nutrient("salt"))
        },
        "nutrients_per_100g": {
            "calories": get_nutrient("energy-kcal"),
            "protein": get_nutrient("proteins"),
            "carbs": get_nutrient("carbohydrates"),
            "fat": get_nutrient("fat"),
            "fiber": get_nutrient("fiber"),
            "sugar": get_nutrient("sugars"),
            "sodium": get_nutrient("sodium"),
            "saturated_fat": get_nutrient("saturated-fat"),
            "salt": get_nutrient("salt")
        }
    }
    
    return formatted

# ==================== SEARCH & PRODUCT ENDPOINTS ====================

@app.get("/search")
async def search_foods(
    query: str = Query(..., description="Search term (e.g., 'nutella', 'banana', 'kwark')"),
    quantity: Optional[float] = Query(100, description="Quantity in grams (default: 100g)"),
    page_size: int = Query(25, ge=1, le=100, description="Number of results (max 100)"),
    page: int = Query(1, ge=1, description="Page number")
):
    """
    Search for products by name/keyword and optionally adjust nutrients by quantity.
    Example: /search?query=nutella&quantity=30
    """
    products, total_count = await search_products_openfoodfacts(query, page_size, page)
    
    if not products:
        raise HTTPException(status_code=404, detail=f"No products found for query: {query}")
    
    formatted_products = []
    for product in products:
        formatted = format_product(product, quantity)
        if formatted:
            formatted_products.append(formatted)
    
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
async def get_product_details(
    barcode: str,
    quantity: Optional[float] = Query(100, description="Quantity in grams (default: 100g)")
):
    """
    Get detailed information about a specific product by its barcode.
    Example: /product/3017624010701?quantity=30
    (Nutella barcode with 30g serving)
    """
    product = await get_product_by_barcode_openfoodfacts(barcode)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    formatted = format_product(product, quantity)
    
    if not formatted:
        raise HTTPException(status_code=404, detail="Product not found or invalid data")
    
    return formatted

# ==================== INTAKE ENDPOINTS ====================
from sqlalchemy import text
from datetime import datetime, date
import uuid

# ==================== INTAKE OPERATIONS ====================

def insert_intake_record(session, intake_data: dict):
    """
    Insert a food intake record into the database.
    """
    query = text("""
        INSERT INTO daily_food_intake (
            id, user_id, product_name, quantity_grams, carbs, protein, fat,
            fiber, sugar, sodium, calories, meal_type, intake_date, intake_time,
            barcode, created_at
        ) VALUES (
            :id, :user_id, :product_name, :quantity, :carbs, :protein, :fat,
            :fiber, :sugar, :sodium, :calories, :meal_type, :intake_date, :intake_time,
            :barcode, :created_at
        )
        RETURNING id, user_id, product_name, quantity_grams, carbs, protein, fat,
                  calories, meal_type, intake_date, intake_time, created_at
    """)
    
    result = session.execute(query, intake_data)
    session.commit()
    return result.fetchone()._asdict()
from sqlalchemy import text
from datetime import datetime, date
import uuid

# ==================== INTAKE OPERATIONS ====================

def insert_intake_record(session, intake_data: dict):
    """
    Insert a food intake record into the database.
    """
    query = text("""
        INSERT INTO daily_food_intake (
            user_id, product_name, quantity_grams, carbs, protein, fat,
            fiber, sugar, sodium, calories, meal_type, intake_date, intake_time,
            barcode, created_at
        ) VALUES (
            :user_id, :product_name, :quantity, :carbs, :protein, :fat,
            :fiber, :sugar, :sodium, :calories, :meal_type, :intake_date, :intake_time,
            :barcode, :created_at
        )
        RETURNING id, user_id, product_name, quantity_grams, carbs, protein, fat,
                  calories, meal_type, intake_date, intake_time, created_at
    """)
    
    result = session.execute(query, intake_data)
    session.commit()
    return result.fetchone()._asdict()


@app.post("/intake/add")
def add_intake(intake: AddIntakeRequest):
    """
    Add a food intake record.
    """
    intake_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    
    record = {
        "id": intake_id,
        "user_id": intake.user_id,
        "product_name": intake.product_name,
        "quantity": intake.quantity,
        "calories": intake.calories,
        "protein": intake.protein,
        "carbs": intake.carbs,
        "fat": intake.fat,
        "fiber": intake.fiber,
        "sugar": intake.sugar,
        "sodium": intake.sodium,
        "meal_type": intake.meal_type,
        "intake_date": intake.intake_date or date.today().isoformat(),
        "intake_time": intake.intake_time or datetime.now().strftime("%H:%M:%S"),
        "barcode": intake.barcode,
        "created_at": current_time
    }
    
    with SessionLocal() as session:
        try:
            saved_record = insert_intake_record(session, record)
            return {
                "message": "Food intake added successfully",
                "record": saved_record
            }
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/intake/add-from-barcode")
async def add_intake_from_barcode(intake: AddIntakeFromBarcodeRequest):
    """
    Add a food intake record using a barcode lookup from OpenFoodFacts.
    """
    product = await get_product_by_barcode_openfoodfacts(intake.barcode)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in OpenFoodFacts database")
    
    formatted = format_product(product, intake.quantity)
    
    if not formatted:
        raise HTTPException(status_code=404, detail="Invalid product data")
    
    intake_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    
    record = {
        "id": intake_id,
        "user_id": intake.user_id,
        "product_name": formatted["product_name"],
        "barcode": intake.barcode,
        "quantity": intake.quantity,
        "calories": formatted["nutrients"]["calories"],
        "protein": formatted["nutrients"]["protein"],
        "carbs": formatted["nutrients"]["carbs"],
        "fat": formatted["nutrients"]["fat"],
        "fiber": formatted["nutrients"]["fiber"],
        "sugar": formatted["nutrients"]["sugar"],
        "sodium": formatted["nutrients"]["sodium"],
        "meal_type": intake.meal_type,
        "intake_date": intake.intake_date or date.today().isoformat(),
        "intake_time": intake.intake_time or datetime.now().strftime("%H:%M:%S"),
        "created_at": current_time
    }
    
    with SessionLocal() as session:
        try:
            saved_record = insert_intake_record(session, record)
            return {
                "message": "Food intake added from barcode successfully",
                "record": saved_record
            }
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/intake/daily/{user_id}")
def get_daily_intake(
    user_id: str,
    intake_date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format")
):
    """
    Get daily intake summary for a user.
    """
    target_date = intake_date or date.today().isoformat()
    
    query = text("""
        SELECT 
            id,
            product_name,
            quantity_grams,
            calories,
            protein,
            carbs,
            fat,
            meal_type,
            intake_time,
            intake_date
        FROM daily_food_intake
        WHERE user_id = :user_id 
        AND intake_date = :target_date
        ORDER BY intake_time
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {"user_id": user_id, "target_date": target_date})
            records = [dict(row._mapping) for row in result]
            
            # Calculate totals
            total_calories = sum(float(r.get("calories") or 0) for r in records)
            total_protein = sum(float(r.get("protein") or 0) for r in records)
            total_carbs = sum(float(r.get("carbs") or 0) for r in records)
            total_fat = sum(float(r.get("fat") or 0) for r in records)
            
            # Return in the EXACT format frontend expects
            return {
                "date": target_date,
                "total_calories": round(total_calories, 2),
                "total_protein": round(total_protein, 2),
                "total_carbs": round(total_carbs, 2),
                "total_fat": round(total_fat, 2),
                "items": records  # ← Changed from "records" to "items"
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/intake/delete/{id}")
def delete_intake(id: str):
    """
    Delete a food intake record.
    """
    query = text("""
        DELETE FROM daily_food_intake
        WHERE id = :id
        RETURNING id
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {"id": id})
            deleted = result.fetchone()
            
            if not deleted:
                raise HTTPException(status_code=404, detail="Intake record not found")
            
            session.commit()
            return {
                "message": "Intake record deleted successfully",
                "id": id
            }
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/intake/range/{user_id}")
def get_intake_range(
    user_id: str,
    start_date: str = Query(..., description="Start date (YYYY-MM-DD)"),
    end_date: str = Query(..., description="End date (YYYY-MM-DD)")
):
    """
    Get intake records for a date range.
    """
    query = text("""
        SELECT 
            intake_date,
            COUNT(*) as total_records,
            SUM(calories) as total_calories,
            SUM(protein) as total_protein,
            SUM(carbs) as total_carbs,
            SUM(fat) as total_fat
        FROM daily_food_intake
        WHERE user_id = :user_id
        AND intake_date BETWEEN :start_date AND :end_date
        GROUP BY intake_date
        ORDER BY intake_date
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {
                "user_id": user_id,
                "start_date": start_date,
                "end_date": end_date
            })
            
            daily_summaries = [
                {
                    "date": row.intake_date.isoformat() if hasattr(row.intake_date, 'isoformat') else row.intake_date,
                    "total_records": row.total_records,
                    "totals": {
                        "calories": round(float(row.total_calories or 0), 2),
                        "protein": round(float(row.total_protein or 0), 2),
                        "carbs": round(float(row.total_carbs or 0), 2),
                        "fat": round(float(row.total_fat or 0), 2)
                    }
                }
                for row in result
            ]
            
            return {
                "user_id": user_id,
                "start_date": start_date,
                "end_date": end_date,
                "daily_summaries": daily_summaries
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/intake/week/{user_id}")
def get_weekly_summary(
    user_id: str,
    week_date: Optional[str] = Query(None, description="Any date in the week (YYYY-MM-DD)")
):
    """
    Get weekly intake summary.
    """
    target_date = datetime.fromisoformat(week_date) if week_date else datetime.now()
    
    # Calculate start of week (Monday)
    week_start = target_date - timedelta(days=target_date.weekday())
    week_end = week_start + timedelta(days=6)
    
    query = text("""
        SELECT 
            intake_date,
            COUNT(*) as total_records,
            SUM(calories) as total_calories,
            SUM(protein) as total_protein,
            SUM(carbs) as total_carbs,
            SUM(fat) as total_fat
        FROM daily_food_intake
        WHERE user_id = :user_id
        AND intake_date BETWEEN :week_start AND :week_end
        GROUP BY intake_date
        ORDER BY intake_date
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {
                "user_id": user_id,
                "week_start": week_start.date().isoformat(),
                "week_end": week_end.date().isoformat()
            })
            
            daily_summaries = [
                {
                    "date": row.intake_date.isoformat() if hasattr(row.intake_date, 'isoformat') else row.intake_date,
                    "total_records": row.total_records,
                    "totals": {
                        "calories": round(float(row.total_calories or 0), 2),
                        "protein": round(float(row.total_protein or 0), 2),
                        "carbs": round(float(row.total_carbs or 0), 2),
                        "fat": round(float(row.total_fat or 0), 2)
                    }
                }
                for row in result
            ]
            
            return {
                "user_id": user_id,
                "week_start": week_start.date().isoformat(),
                "week_end": week_end.date().isoformat(),
                "daily_summaries": daily_summaries
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.put("/intake/update/{record_id}")
def update_intake(record_id: str, update: UpdateIntakeRequest):
    """
    Update an existing intake record.
    """
    # Build dynamic update query based on provided fields
    update_fields = update.dict(exclude_none=True)
    
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    set_clause = ", ".join([f"{key} = :{key}" for key in update_fields.keys()])
    
    query = text(f"""
        UPDATE daily_food_intake
        SET {set_clause}
        WHERE id = :record_id
        RETURNING id, product_name, quantity_grams, calories, protein, carbs, fat
    """)
    
    with SessionLocal() as session:
        try:
            update_fields["record_id"] = record_id
            result = session.execute(query, update_fields)
            updated = result.fetchone()
            
            if not updated:
                raise HTTPException(status_code=404, detail="Intake record not found")
            
            session.commit()
            return {
                "message": "Intake record updated successfully",
                "record_id": record_id,
                "updated_fields": update.dict(exclude_none=True)
            }
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# ==================== FAVORITES OPERATIONS ====================

@app.post("/favorites/add")
def add_favorite(favorite: AddFavoriteRequest):
    """
    Add a product to user's favorites.
    """
    favorite_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    
    query = text("""
        INSERT INTO user_favorites (
            id, user_id, product_name, default_quantity, unit,
            calories, protein, carbs, fat, fiber, sugar, sodium,
            barcode, notes, created_at
        ) VALUES (
            :id, :user_id, :product_name, :default_quantity, :unit,
            :calories, :protein, :carbs, :fat, :fiber, :sugar, :sodium,
            :barcode, :notes, :created_at
        )
        RETURNING id, user_id, product_name, default_quantity, unit, created_at
    """)
    
    record = {
        "id": favorite_id,
        "user_id": favorite.user_id,
        "product_name": favorite.product_name,
        "default_quantity": favorite.default_quantity,
        "unit": favorite.unit,
        "calories": favorite.calories,
        "protein": favorite.protein,
        "carbs": favorite.carbs,
        "fat": favorite.fat,
        "fiber": favorite.fiber,
        "sugar": favorite.sugar,
        "sodium": favorite.sodium,
        "barcode": favorite.barcode,
        "notes": favorite.notes,
        "created_at": current_time
    }
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, record)
            saved = result.fetchone()._asdict()
            session.commit()
            
            return {
                "message": "Favorite added successfully",
                "favorite": saved
            }
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/favorites/add-from-barcode")
async def add_favorite_from_barcode(favorite: AddFavoriteFromBarcodeRequest):
    """
    Add a product to favorites using barcode lookup from OpenFoodFacts.
    """
    product = await get_product_by_barcode_openfoodfacts(favorite.barcode)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found in OpenFoodFacts database")
    
    formatted = format_product(product, favorite.default_quantity)
    
    if not formatted:
        raise HTTPException(status_code=404, detail="Invalid product data")
    
    favorite_id = str(uuid.uuid4())
    current_time = datetime.now().isoformat()
    
    query = text("""
        INSERT INTO user_favorites (
            id, user_id, product_name, default_quantity, unit,
            calories, protein, carbs, fat, fiber, sugar, sodium,
            barcode, notes, created_at
        ) VALUES (
            :id, :user_id, :product_name, :default_quantity, :unit,
            :calories, :protein, :carbs, :fat, :fiber, :sugar, :sodium,
            :barcode, :notes, :created_at
        )
        RETURNING id, user_id, product_name, barcode, created_at
    """)
    
    record = {
        "id": favorite_id,
        "user_id": favorite.user_id,
        "product_name": formatted["product_name"],
        "barcode": favorite.barcode,
        "default_quantity": favorite.default_quantity,
        "unit": "g",
        "calories": formatted["nutrients"]["calories"],
        "protein": formatted["nutrients"]["protein"],
        "carbs": formatted["nutrients"]["carbs"],
        "fat": formatted["nutrients"]["fat"],
        "fiber": formatted["nutrients"]["fiber"],
        "sugar": formatted["nutrients"]["sugar"],
        "sodium": formatted["nutrients"]["sodium"],
        "notes": favorite.notes,
        "created_at": current_time
    }
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, record)
            saved = result.fetchone()._asdict()
            session.commit()
            
            return {
                "message": "Favorite added from barcode successfully",
                "favorite": saved
            }
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/favorites/{user_id}")
def get_favorites(user_id: str):
    """
    Get all favorites for a user.
    """
    query = text("""
        SELECT 
            id, product_name, default_quantity, unit,
            calories, protein, carbs, fat,
            barcode, notes, created_at
        FROM user_favorites
        WHERE user_id = :user_id
        ORDER BY created_at DESC
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {"user_id": user_id})
            favorites = [dict(row._mapping) for row in result]
            
            return {
                "user_id": user_id,
                "total_favorites": len(favorites),
                "favorites": favorites
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/favorites/detail/{favorite_id}")
def get_favorite_detail(
    favorite_id: str,
    user_id: str = Query(..., description="User ID to verify ownership")
):
    """
    Get detailed information about a specific favorite.
    """
    query = text("""
        SELECT *
        FROM user_favorites
        WHERE id = :favorite_id AND user_id = :user_id
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {"favorite_id": favorite_id, "user_id": user_id})
            favorite = result.fetchone()
            
            if not favorite:
                raise HTTPException(status_code=404, detail="Favorite not found")
            
            return dict(favorite._mapping)
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/favorites/{favorite_id}")
def delete_favorite(
    favorite_id: str,
    user_id: str = Query(..., description="User ID to verify ownership")
):
    """
    Delete a favorite.
    """
    query = text("""
        DELETE FROM user_favorites
        WHERE id = :favorite_id AND user_id = :user_id
        RETURNING id
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {"favorite_id": favorite_id, "user_id": user_id})
            deleted = result.fetchone()
            
            if not deleted:
                raise HTTPException(status_code=404, detail="Favorite not found")
            
            session.commit()
            return {
                "message": "Favorite deleted successfully",
                "favorite_id": favorite_id
            }
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/favorites/add-to-intake")
def add_favorite_to_intake(request: AddFavoriteToIntakeRequest):
    """
    Add a favorite to intake log.
    """
    # Fetch favorite details
    fetch_query = text("""
        SELECT *
        FROM user_favorites
        WHERE id = :favorite_id AND user_id = :user_id
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(fetch_query, {
                "favorite_id": request.favorite_id,
                "user_id": request.user_id
            })
            favorite = result.fetchone()
            
            if not favorite:
                raise HTTPException(status_code=404, detail="Favorite not found")
            
            favorite_dict = dict(favorite._mapping)
            quantity = request.quantity or favorite_dict["default_quantity"]
            scale = quantity / favorite_dict["default_quantity"]
            
            intake_id = str(uuid.uuid4())
            current_time = datetime.now().isoformat()
            
            insert_query = text("""
                INSERT INTO daily_food_intake (
                    id, user_id, product_name, quantity_grams,
                    calories, protein, carbs, fat, fiber, sugar, sodium,
                    meal_type, intake_date, intake_time, barcode, created_at
                ) VALUES (
                    :id, :user_id, :product_name, :quantity,
                    :calories, :protein, :carbs, :fat, :fiber, :sugar, :sodium,
                    :meal_type, :intake_date, :intake_time, :barcode, :created_at
                )
                RETURNING id, product_name, quantity_grams, calories, protein, carbs, fat
            """)
            
            record = {
                "id": intake_id,
                "user_id": request.user_id,
                "product_name": favorite_dict["product_name"],
                "quantity": quantity,
                "calories": round(favorite_dict["calories"] * scale, 2),
                "protein": round(favorite_dict["protein"] * scale, 2),
                "carbs": round(favorite_dict["carbs"] * scale, 2),
                "fat": round(favorite_dict["fat"] * scale, 2),
                "fiber": round(favorite_dict["fiber"] * scale, 2) if favorite_dict.get("fiber") else None,
                "sugar": round(favorite_dict["sugar"] * scale, 2) if favorite_dict.get("sugar") else None,
                "sodium": round(favorite_dict["sodium"] * scale, 2) if favorite_dict.get("sodium") else None,
                "meal_type": request.meal_type,
                "intake_date": request.intake_date or date.today().isoformat(),
                "intake_time": request.intake_time or datetime.now().strftime("%H:%M:%S"),
                "barcode": favorite_dict.get("barcode"),
                "created_at": current_time
            }
            
            result = session.execute(insert_query, record)
            saved = result.fetchone()._asdict()
            session.commit()
            
            return {
                "message": "Favorite added to intake successfully",
                "record": saved
            }
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        

# Add these endpoints to your FastAPI backend

@app.get("/goals/{user_id}")
def get_user_goals(user_id: str):
    """
    Get nutrition goals for a user.
    """
    query = text("""
        SELECT 
            calorie_goal,
            carbs_goal,
            protein_goal,
            fat_goal,
            updated_at
        FROM user_nutrition_goals
        WHERE user_id = :user_id
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {"user_id": user_id})
            goals = result.fetchone()
            
            if not goals:
                # Return default goals if none exist
                return {
                    "calorie_goal": 2000,
                    "carbs_goal": 200,
                    "protein_goal": 150,
                    "fat_goal": 60,
                    "has_custom_goals": False
                }
            
            return {
                "calorie_goal": goals.calorie_goal,
                "carbs_goal": goals.carbs_goal,
                "protein_goal": goals.protein_goal,
                "fat_goal": goals.fat_goal,
                "updated_at": goals.updated_at.isoformat() if hasattr(goals.updated_at, 'isoformat') else goals.updated_at,
                "has_custom_goals": True
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/goals/update")
def update_user_goals(goals: UpdateGoalsRequest):
    """
    Update or create nutrition goals for a user.
    """
    query = text("""
        INSERT INTO user_nutrition_goals (
            user_id, calorie_goal, carbs_goal, protein_goal, fat_goal, created_at, updated_at
        ) VALUES (
            :user_id, :calorie_goal, :carbs_goal, :protein_goal, :fat_goal, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT (user_id) 
        DO UPDATE SET
            calorie_goal = EXCLUDED.calorie_goal,
            carbs_goal = EXCLUDED.carbs_goal,
            protein_goal = EXCLUDED.protein_goal,
            fat_goal = EXCLUDED.fat_goal,
            updated_at = CURRENT_TIMESTAMP
        RETURNING calorie_goal, carbs_goal, protein_goal, fat_goal, updated_at
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {
                "user_id": goals.user_id,
                "calorie_goal": goals.calorie_goal,
                "carbs_goal": goals.carbs_goal,
                "protein_goal": goals.protein_goal,
                "fat_goal": goals.fat_goal
            })
            updated = result.fetchone()
            session.commit()
            
            return {
                "message": "Goals updated successfully",
                "goals": {
                    "calorie_goal": updated.calorie_goal,
                    "carbs_goal": updated.carbs_goal,
                    "protein_goal": updated.protein_goal,
                    "fat_goal": updated.fat_goal,
                    "updated_at": updated.updated_at.isoformat() if hasattr(updated.updated_at, 'isoformat') else updated.updated_at
                }
            }
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.delete("/goals/{user_id}")
def reset_user_goals(user_id: str):
    """
    Delete custom goals for a user (will revert to defaults).
    """
    query = text("""
        DELETE FROM user_nutrition_goals
        WHERE user_id = :user_id
        RETURNING user_id
    """)
    
    with SessionLocal() as session:
        try:
            result = session.execute(query, {"user_id": user_id})
            deleted = result.fetchone()
            
            if not deleted:
                raise HTTPException(status_code=404, detail="No custom goals found for this user")
            
            session.commit()
            return {
                "message": "Goals reset to defaults successfully",
                "user_id": user_id
            }
        except HTTPException:
            raise
        except Exception as e:
            session.rollback()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
# ==================== HEALTH CHECK ====================

@app.get("/")
def root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "Nutrition API is running",
        "version": "1.0.0"
    }