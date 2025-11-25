from fastapi import FastAPI, Request
import json
from fastapi.responses import JSONResponse
import requests
from typing import Dict, Any
from sqlalchemy import create_engine, text
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, Body


from DB.db import insert_onboarding_form_for_trainer_email, check_login, check_login_client ,create_account, show_form, resave, changeTrainerscode, fetch_trainer_code, client_check_trainer, get_forms_for_trainer_code, linktrainercode, save_form_details_client, get_client_submissions_for_trainers_code

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