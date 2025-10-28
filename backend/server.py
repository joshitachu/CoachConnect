from fastapi import FastAPI, Request
import json
from fastapi.responses import JSONResponse
import requests

from sqlalchemy import create_engine, text

from DB.db import insertOnboardingForm

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
    insertOnboardingForm(data)
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



@app.get('/api/form-show')
def get_form():
    print("Received request for a specific form")
    return JSONResponse(content=form)


engine = create_engine(DATABASE_URL, pool_pre_ping=True)


db_url= "postgresql+psycopg2://coach_user:voetbal123@127.0.0.1:5432/coachconnect"

