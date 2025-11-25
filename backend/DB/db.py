# db.py
from sqlalchemy import create_engine, text, bindparam
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB
from dotenv import load_dotenv
import os
import json
import random
import string
from typing import Optional, Dict, Any, List

# --- Config ---
load_dotenv()
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://coach_user:voetbal123@192.168.1.100:5432/coachconnect",
)

EXAMPLE_FORM: Dict[str, Any] = {
    "id": "form-1759307521509",
    "name": "joshuas form",
    "description": "test form",
    "fields": [
        {"id": "field-1759307528323", "type": "text", "label": "text", "placeholder": "", "required": False, "validation": [], "visibilityRules": []},
        {"id": "field-1759307533090", "type": "email", "label": "email field", "placeholder": "", "required": False, "validation": [], "visibilityRules": []},
        {"id": "field-1759307537773", "type": "number", "label": "number", "placeholder": "", "required": False, "validation": [], "visibilityRules": []},
        {"id": "field-1759307543691", "type": "textarea", "label": "textarea", "placeholder": "", "required": False, "validation": [], "visibilityRules": []},
        {"id": "field-1759307549573", "type": "select", "label": "select field", "placeholder": "", "required": False, "options": ["Option 1","Option 2","Option 3"], "validation": [], "visibilityRules": []},
    ],
    "createdAt": "2025-10-01T08:32:01.509Z",
    "updatedAt": "2025-10-01T08:32:37.222Z"
}

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

# --------------------------
# Helpers for the ERD schema
# --------------------------

def _sanitize_email(email: str) -> str:
    """Trim spaces/punctuation that sometimes sneak in from UI."""
    return (email or "").strip().strip(",;")

def get_trainers_code_by_email(db, email: str) -> Optional[str]:
    row = db.execute(
        text("SELECT trainers_code FROM trainer_user WHERE email = :email"),
        {"email": email},
    ).fetchone()
    return row[0] if row else None

def upsert_trainer_return_code(
    db,
    email: str,
    first_name: Optional[str] = None,
    last_name: Optional[str] = None,
    trainers_code: Optional[str] = None,
) -> str:
    """
    Ensure a trainer exists in trainer_user and return trainers_code.
    - If trainer exists (by unique email), optionally updates names and returns existing trainers_code.
    - If not, inserts a new row; if trainers_code not provided, generates a simple code.
    """
    email = _sanitize_email(email)

    code = get_trainers_code_by_email(db, email)
    if code:
        # Optional update of names if given
        db.execute(
            text("""
                UPDATE trainer_user
                   SET first_name = COALESCE(:first_name, first_name),
                       last_name  = COALESCE(:last_name,  last_name)
                 WHERE email = :email
            """),
            {"first_name": first_name, "last_name": last_name, "email": email},
        )
        return code

    if not trainers_code:
        local = email.split("@")[0] if "@" in email else email
        trainers_code = (local[:20] + "-001").lower()

    row = db.execute(
        text("""
            INSERT INTO trainer_user (first_name, last_name, email, password, trainers_code)
            VALUES (:first_name, :last_name, :email, :password, :trainers_code)
            ON CONFLICT (email) DO UPDATE
              SET first_name = EXCLUDED.first_name,
                  last_name  = EXCLUDED.last_name
            RETURNING trainers_code
        """),
        {
            "first_name": first_name or "",
            "last_name": last_name or "",
            "email": email,
            "password": "",  # TODO: set real hash in your auth flow
            "trainers_code": trainers_code,
        },
    ).fetchone()
    return row[0]



def insert_onboarding_form_for_trainer_email(trainer_email: str, form_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Ensure trainer exists, then insert onboarding_forms with:
      - trainers_code (FK to trainer_user.trainers_code)
      - title, description
      - form_schema_json (JSONB)
    """
    trainer_email = _sanitize_email(trainer_email)

    with SessionLocal() as db:
        try:
            code = upsert_trainer_return_code(db, email=trainer_email)

            stmt = (
                text("""
                    INSERT INTO onboarding_forms (trainers_code, title, description, form_schema_json)
                    VALUES (:trainers_code, :title, :description, :form_schema_json)
                    RETURNING id
                """)
                .bindparams(bindparam("form_schema_json", type_=JSONB))
            )

            title = form_dict.get("name") or "Untitled form"
            description = form_dict.get("description")

            row = db.execute(
                stmt,
                {
                    "trainers_code": code,
                    "title": title,
                    "description": description,
                    "form_schema_json": form_dict,
                },
            ).fetchone()
            db.commit()
            return {"status": "success", "onboarding_form_id": int(row[0]), "trainers_code": code}

        except Exception:
            db.rollback()
            raise

def list_trainers() -> List[Dict[str, Any]]:
    with SessionLocal() as db:
        rows = db.execute(
            text("SELECT id, first_name, last_name, email, trainers_code, created_at FROM trainer_user ORDER BY id")
        ).fetchall()
        return [dict(r._mapping) for r in rows]

def get_forms_by_trainer_email(trainer_email: str) -> List[Dict[str, Any]]:
    trainer_email = _sanitize_email(trainer_email)

    with SessionLocal() as db:
        rows = db.execute(
            text("""
                SELECT f.id, f.title, f.description, f.form_schema_json, f.created_at
                  FROM onboarding_forms f
                  JOIN trainer_user t ON t.trainers_code = f.trainers_code
                 WHERE t.email = :email
                 ORDER BY f.created_at DESC, f.id DESC
            """),
            {"email": trainer_email},
        ).fetchall()

        out: List[Dict[str, Any]] = []
        for r in rows:
            m = dict(r._mapping)
            # psycopg2 already returns dict for JSONB; keep a safe fallback
            if isinstance(m.get("form_schema_json"), str):
                try:
                    m["form_schema_json"] = json.loads(m["form_schema_json"])
                except Exception:
                    pass
            out.append(m)
        return out

# --- Login helper ---
def check_login(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Check if a trainer user with the given email and password exists.
    Returns user data dict if credentials are valid, else None.
    """
    email = _sanitize_email(email)
    print(email, password)
    
    with SessionLocal() as db:
        row = db.execute(
            text("SELECT * FROM trainer_user WHERE email = :email AND password = :password"),
            {"email": email, "password": password}
        ).fetchone()
        
        print("DB query result:", row)
        
        if row:
            # Convert row to dictionary
            # Assuming your columns are: id, first_name, last_name, email, country, phone_number, etc.
            return {
                "id": row.id,
                "first_name": row.first_name,
                "last_name": row.last_name,
                "email": row.email,
                "country": row.country if hasattr(row, 'country') else None,
                "phone_number": row.phone_number if hasattr(row, 'phone_number') else None,
                "role": "trainer"
            }
        return None

def show_form(email: str) -> list:
    """
    Retrieve all form schemas for a trainer based on their email.
    Returns a list of form_schema_json objects.
    """
    email = _sanitize_email(email)  # Make sure to sanitize email for safety
    print(email)
    
    # Query the database
    with SessionLocal() as db:
        # Use the parameterized query correctly to retrieve all form schemas for the email
        rows = db.execute(
            text("""SELECT onboarding_forms.form_schema_json 
                    FROM onboarding_forms
                    JOIN trainer_user 
                    ON onboarding_forms.trainers_code = trainer_user.trainers_code
                    WHERE trainer_user.email = :email"""),  # Use :email as placeholder
            {"email": email}  # Pass email as a parameter
        ).fetchall()

        print("DB query result:", rows)
    
        # If rows are found, return the list of form_schema_json; otherwise, return an empty list
        return [row[0] for row in rows] if rows else []


def check_login_client(email: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Check if a client user with the given email and password exists.
    Returns user data dict if credentials are valid, else None.
    """
    email = _sanitize_email(email)
    print(email, password)
    
    with SessionLocal() as db:
        row = db.execute(
            text("SELECT * FROM client_user WHERE email = :email AND password = :password"),
            {"email": email, "password": password}
        ).fetchone()
        
        print("DB query result:", row)
        
        if row:
            # Convert row to dictionary
            return {
                "id": row.id,
                "first_name": row.first_name,
                "last_name": row.last_name,
                "email": row.email,
                "country": row.country if hasattr(row, 'country') else None,
                "phone_number": row.phone_number if hasattr(row, 'phone_number') else None,
                "role": "client"
            }
        return None

def create_account(client_data: Dict[str, Any], role: str) -> bool:
    """
    Create a new user in the appropriate table based on role.
    Returns True if creation is successful, else False.
    """

    # Extract once so both branches can use them
    first_name   = client_data.get("first_name") or ""
    last_name    = client_data.get("last_name") or ""
    password     = client_data.get("password") or ""   # TODO: hash this!
    phone_number = client_data.get("phone_number") or ""
    country      = client_data.get("country") or ""
    email        = _sanitize_email(client_data.get("email"))


    # Choose the table explicitly to avoid injection
    if role == "client":
                insert_sql = text("""
                    INSERT INTO client_user
                      (first_name, last_name, email, password, phone_number, country)
                    VALUES
                      (:first_name, :last_name, :email, :password, :phone_number, :country)
                """)
                params = {
                    "first_name": first_name,
                    "last_name": last_name,
                    "email": email,
                    "password": password,
                    "phone_number": phone_number,
                    "country": country,
                }
    elif role == "trainer":
        trainers_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        insert_sql = text("""
            INSERT INTO trainer_user
              (first_name, last_name, email, password, phone_number, country, trainers_code)
            VALUES
              (:first_name, :last_name, :email, :password, :phone_number, :country, :trainers_code)
        """)
        params = {
            "first_name": first_name,
            "last_name": last_name,
            "email": email,
            "password": password,
            "phone_number": phone_number,
            "country": country,
            "trainers_code": trainers_code,  # <-- pass it here
        }
    else:
        # Invalid role; let caller handle properly if needed
        return False



    with SessionLocal() as db:
        try:
            db.execute(insert_sql, params)
            db.commit()
            return True
        except Exception as e:
            print(f"Error creating {role} account:", e)
            db.rollback()
            return False
    

def resave(form_data: Dict[str, Any]) -> bool:
    """
    Resave the form data into the onboarding_forms table.
    Returns True if successful, else False.
    """
    # formSchema is the nested object we care about
    form_schema = form_data.get("formSchema") or {}
    form_id = form_schema.get("id")

    if not form_id:
        print("Form ID is required for resaving.")
        return False

    # Use fields from formSchema (your payload structure)
    title = form_schema.get("name", "Untitled form")
    description = form_schema.get("description", "")
    form_schema_json = form_schema  # SQLAlchemy will JSON-encode this for JSONB

    with SessionLocal() as db:
        try:
            stmt = (
                text("""
                    UPDATE onboarding_forms
                    SET
                        title = :title,
                        description = :description,
                        form_schema_json = :form_schema_json,
                        created_at = NOW()
                    WHERE
                        form_schema_json->>'id' = :form_id;
                """)
                .bindparams(
                    bindparam("form_schema_json", type_=JSONB),
                )
            )

            result = db.execute(
                stmt,
                {
                    "title": title,
                    "description": description,
                    "form_schema_json": form_schema_json,
                    "form_id": form_id,
                },
            )
            db.commit()

            if result.rowcount == 0:
                print(f"No form found with id {form_id}")
                return False

            return True

        except Exception as e:
            print("Error resaving form:", e)
            db.rollback()
            return False
        

def changeTrainerscode(koppelcode: json) -> bool:
    """
    Change the trainers_code for a trainer user.
    Returns True if successful, else False.
    """
    new_code = koppelcode["code"]
    email = _sanitize_email(koppelcode['email'])
    print(new_code, email)

    if not new_code or not email:
        print("Both new trainers_code and email are required.")
        return False

    with SessionLocal() as db:
        try:
            result = db.execute(
                text("""
                    UPDATE trainer_user
                    SET trainers_code = :new_code
                    WHERE email = :email;
                """),
                {"new_code": new_code, "email": email},
            )
            db.commit()

            if result.rowcount == 0:
                print(f"No trainer found with email {email}")
                return False

            return True

        except Exception as e:
            print("Error changing trainers_code:", e)
            db.rollback()
            return False
        
def fetch_trainer_code(email: str) -> Optional[str]:
    """
    Fetch the trainers_code for a trainer user based on email.
    Returns the trainers_code if found, else None.
    """
    email = _sanitize_email(email)
    print(email)

    with SessionLocal() as db:
        row = db.execute(
            text("SELECT trainers_code FROM trainer_user WHERE email = :email"),
            {"email": email}
        ).fetchone()

        print("DB query result:", row)

        if row:
            return row[0]  # Return the trainers_code
        return None
    


def client_check_trainer(email: str) -> Dict:
    """
    Check if a client (by email) has any linked trainers.

    Returns:
    {
        "has_trainer": bool,
        "trainers": [
            {
                "code": str,
                "first_name": str,
                "last_name": str,
                "email": str,
                "id": int
            }
        ]
    }
    """
    email = _sanitize_email(email)

    query = """
        SELECT tu.trainers_code, tu.first_name, tu.last_name, tu.email, tu.id
        FROM client_user cu
        JOIN client_trainer ct ON ct.client_id = cu.id
        JOIN trainer_user tu ON tu.trainers_code = ct.trainers_code
        WHERE cu.email = :email;
    """

    with SessionLocal() as db:
        rows = db.execute(text(query), {"email": email}).fetchall()

    if not rows:
        return {"has_trainer": False, "trainers": []}

    trainers = [
        {
            "code": row[0],
            "first_name": row[1],
            "last_name": row[2],
            "email": row[3],
            "id": row[4],
        }
        for row in rows
    ]

    return {
        "has_trainer": True,
        "trainers": trainers
    }


def fetch_trainer_code_based_of_client(trainerscode: str) -> Optional[str]:
    """
    Fetch the trainers_code for a trainer user based on email.
    Returns the trainers_code if found, else None.
    """
    email = _sanitize_email(email)
    print(email)

    with SessionLocal() as db:
        row = db.execute(
            text("SELECT trainers_code FROM trainer_user WHERE email = :email"),
            {"email": email}
        ).fetchone()

        print("DB query result:", row)

        if row:
            return row[0]  # Return the trainers_code
        return None
    
def get_forms_for_trainer_code(trainers_code: str) -> List[Dict[str, Any]]:
    """
    Retrieve all form schemas for a trainer based on their trainers_code.
    Returns a list of form_schema_json objects.
    """
    with SessionLocal() as db:
        rows = db.execute(
            text("""
                SELECT form_schema_json 
                FROM onboarding_forms
                WHERE trainers_code = :trainers_code
            """),
            {"trainers_code": trainers_code}
        ).fetchall()

        print("DB query result:", rows)

        return [row[0] for row in rows] if rows else []


def get_client_submissions_for_trainers_code(trainers_code: str) -> List[Dict[str, Any]]:
    """
    Retrieve client-submitted onboarding forms for a given trainers_code.
    Returns a list of dicts with client info and parsed form_data.
    """
    with SessionLocal() as db:
        rows = db.execute(
            text("""
                SELECT cof.id, cof.client_id, cof.form_data, cof.trainers_code, cof.submitted_at,
                       cu.email, cu.first_name, cu.last_name
                  FROM client_onboarding_form cof
                  JOIN client_user cu ON cof.client_id = cu.id
                 WHERE cof.trainers_code = :trainers_code
                 ORDER BY cof.submitted_at DESC
            """),
            {"trainers_code": trainers_code},
        ).fetchall()

        out: List[Dict[str, Any]] = []
        for r in rows:
            m = dict(r._mapping)
            # form_data may be stored as JSON string; parse if needed
            form_data = m.get("form_data")
            try:
                if isinstance(form_data, str):
                    m["form_data"] = json.loads(form_data)
            except Exception:
                # leave as-is on parse error
                pass
            out.append(m)

        return out
    

def linktrainercode(client_email: str, trainers_code: str) -> bool:
    """
    Link a client to a trainer using the trainers_code.
    Returns True if successful, else False.
    """
    client_email = _sanitize_email(client_email)

    with SessionLocal() as db:
        try:
            # Fetch client ID based on email
            client_row = db.execute(
                text("SELECT id FROM client_user WHERE email = :email"),
                {"email": client_email}
            ).fetchone()

            if not client_row:
                print(f"No client found with email {client_email}")
                return False

            client_id = client_row[0]

            # Insert into client_trainer linking table
            db.execute(
                text("""
                    INSERT INTO client_trainer (client_id, trainers_code)
                    VALUES (:client_id, :trainers_code)
                    ON CONFLICT DO NOTHING
                """),
                {"client_id": client_id, "trainers_code": trainers_code}
            )
            db.commit()
            return True

        except Exception as e:
            print("Error linking trainer code:", e)
            db.rollback()
            return False
        

def save_form_details_client(client_email: str, trainers_code: str, form_id: str, form_data: Dict[str, Any]) -> bool:
    """
    Save client form submission and link to trainer.
    Returns True if successful, else False.
    
    Table columns: id (PK), client_id, assigned_at, form_data (jsonb), trainers_code, submitted_at
    """
    client_email = _sanitize_email(client_email)
    
    with SessionLocal() as db:
        try:
            # Fetch client ID based on email
            client_row = db.execute(
                text("SELECT id FROM client_user WHERE email = :email"),
                {"email": client_email}
            ).fetchone()
            
            if not client_row:
                print(f"No client found with email {client_email}")
                return False
            
            client_id = client_row[0]
            
            # Convert form_data dict to JSON string for storage
            form_data_json = json.dumps(form_data)
            
            # Check if a record already exists for this client
            existing = db.execute(
                text("SELECT id FROM client_onboarding_form WHERE client_id = :client_id"),
                {"client_id": client_id}
            ).fetchone()
            
            if existing:
                # Update existing record
                db.execute(
                    text("""
                        UPDATE client_onboarding_form 
                        SET form_data = :form_data,
                            trainers_code = :trainers_code,
                            submitted_at = NOW()
                        WHERE client_id = :client_id
                    """),
                    {
                        "client_id": client_id,
                        "form_data": form_data_json,
                        "trainers_code": trainers_code
                    }
                )
                print(f"Updated existing form for client {client_email}")
            else:
                # Insert new record
                db.execute(
                    text("""
                        INSERT INTO client_onboarding_form (client_id, form_data, trainers_code, submitted_at)
                        VALUES (:client_id, :form_data, :trainers_code, NOW())
                    """),
                    {
                        "client_id": client_id,
                        "form_data": form_data_json,
                        "trainers_code": trainers_code
                    }
                )
                print(f"Inserted new form for client {client_email}")
            
            db.commit()
            print(f"Successfully saved form for client {client_email} with trainer code {trainers_code}")
            return True
            
        except Exception as e:
            print(f"Error saving form submission: {e}")
            db.rollback()
            return False