from fastapi import FastAPI, Request
import json
from fastapi.responses import JSONResponse
import requests
from typing import Dict, Any
from sqlalchemy import create_engine, text

from DB.db import insert_onboarding_form_for_trainer_email, check_login, check_login_client ,create_account

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}


@app.post("/api/forms")
async def get_forms(request: Request):
    print("Received request for forms")
    
    # Extract JSON data from frontend
    data = await request.json()
    print(data)
    insert_onboarding_form_for_trainer_email('joshikabel@gmail.co,',data)
    print("Received data:", data)
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
    role= credentials.get("role")
    if not email or not password:
        print("Missing email or password")
        raise HTTPException(status_code=400, detail="Email and password required")
    if role =="trainer":
        if check_login(email, password):
            print("2")
            return {"success": True, "message": "Login successful"}
        else:
            print("3")
            return {"success": False, "message": "Invalid credentials"}
    else:
        if check_login_client(email, password):
            print("2")
            return {"success": True, "message": "Login successful"}
        else:
            print("3")
            return {"success": False, "message": "Invalid credentials"}




@app.get('/api/form-show')
def get_form():
    print("Received request for a specific form")
    return JSONResponse(content=form)

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