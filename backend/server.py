from fastapi import FastAPI, Request
import json
from fastapi.responses import JSONResponse
import requests
from typing import Dict, Any
from sqlalchemy import create_engine, text

from DB.db import insert_onboarding_form_for_trainer_email, check_login, check_login_client ,create_account, show_form, resave, changeTrainerscode, fetch_trainer_code

app = FastAPI()

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




@app.get('/api/form-show')
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