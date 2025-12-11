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
from contextlib import contextmanager
from datetime import date


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



def calculate_calories(carbs: float, protein: float, fat: float) -> float:
    """Calculate total calories from macronutrients"""
    return round((carbs * 4) + (protein * 4) + (fat * 9), 2)

def insert_food_intake(
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
    with get_db() as db:
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

def get_intake_by_date(user_id: int, intake_date: date) -> List[Dict]:
    """Retrieve all food intake records for a user on a specific date"""
    with get_db() as db:
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
    user_id: int, 
    start_date: date, 
    end_date: date
) -> List[Dict]:
    """Retrieve all food intake records for a user within a date range"""
    with get_db() as db:
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

def get_daily_summary(user_id: int, intake_date: date) -> Dict:
    """Get summary statistics for a user's food intake on a specific date"""
    with get_db() as db:
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
            
            meals = get_intake_by_date(user_id, intake_date)
            
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

def delete_food_intake(record_id: int, user_id: int) -> bool:
    """Delete a specific food intake record"""
    with get_db() as db:
        query = text("""
            DELETE FROM daily_food_intake
            WHERE id = :record_id AND user_id = :user_id
        """)
        
        result = db.execute(query, {'record_id': record_id, 'user_id': user_id})
        
        return result.rowcount > 0

def update_food_intake(
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
    with get_db() as db:
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

def get_all_intake_for_user(user_id: int) -> List[Dict]:
    """Get all food intake records for a specific user"""
    with get_db() as db:
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

def delete_all_intake_for_date(user_id: int, intake_date: date) -> int:
    """Delete all food intake records for a user on a specific date"""
    with get_db() as db:
        query = text("""
            DELETE FROM daily_food_intake
            WHERE user_id = :user_id AND intake_date = :intake_date
        """)
        
        result = db.execute(query, {'user_id': user_id, 'intake_date': intake_date})
        
        return result.rowcount

def get_weekly_summary(user_id: int, start_date: date) -> Dict:
    """Get a 7-day summary starting from start_date"""
    from datetime import timedelta
    
    weekly_data = []
    for i in range(7):
        current_date = start_date + timedelta(days=i)
        summary = get_daily_summary(user_id, current_date)
        weekly_data.append(summary)
    
    # Calculate weekly totals
    total_carbs = sum(day['total_carbs'] for day in weekly_data)
    total_protein = sum(day['total_protein'] for day in weekly_data)
    total_fat = sum(day['total_fat'] for day in weekly_data)
    total_calories = sum(day['total_calories'] for day in weekly_data)
    
    return {
        "user_id": user_id,
        "week_start": start_date,
        "week_end": start_date + timedelta(days=6),
        "weekly_totals": {
            "total_carbs": round(total_carbs, 2),
            "total_protein": round(total_protein, 2),
            "total_fat": round(total_fat, 2),
            "total_calories": round(total_calories, 2),
            "daily_average_calories": round(total_calories / 7, 2)
        },
        "daily_breakdown": weekly_data
    }

def get_monthly_summary(user_id: int, year: int, month: int) -> Dict:
    """Get monthly summary for a specific month"""
    from datetime import timedelta
    from calendar import monthrange
    
    # Get first and last day of month
    first_day = date(year, month, 1)
    last_day_num = monthrange(year, month)[1]
    last_day = date(year, month, last_day_num)
    
    # Get all records for the month
    records = get_intake_by_date_range(user_id, first_day, last_day)
    
    # Calculate totals
    total_carbs = sum(r['carbs'] for r in records)
    total_protein = sum(r['protein'] for r in records)
    total_fat = sum(r['fat'] for r in records)
    total_calories = calculate_calories(total_carbs, total_protein, total_fat)
    
    # Count days with entries
    unique_dates = set(r['intake_date'] for r in records)
    days_tracked = len(unique_dates)
    
    return {
        "user_id": user_id,
        "year": year,
        "month": month,
        "days_in_month": last_day_num,
        "days_tracked": days_tracked,
        "total_entries": len(records),
        "monthly_totals": {
            "total_carbs": round(total_carbs, 2),
            "total_protein": round(total_protein, 2),
            "total_fat": round(total_fat, 2),
            "total_calories": round(total_calories, 2),
            "daily_average_calories": round(total_calories / days_tracked, 2) if days_tracked > 0 else 0
        }
    }

def search_intake_by_product(user_id: int, product_name: str) -> List[Dict]:
    """Search for food intake records by product name (case-insensitive partial match)"""
    with get_db() as db:
        query = text("""
            SELECT id, user_id, product_name, carbs, protein, fat, quantity_grams, intake_date
            FROM daily_food_intake
            WHERE user_id = :user_id AND LOWER(product_name) LIKE LOWER(:product_name)
            ORDER BY intake_date DESC, id
        """)
        
        result = db.execute(query, {
            'user_id': user_id,
            'product_name': f'%{product_name}%'
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

def get_most_consumed_products(user_id: int, limit: int = 10) -> List[Dict]:
    """Get the most frequently consumed products for a user"""
    with get_db() as db:
        query = text("""
            SELECT 
                product_name,
                COUNT(*) as consumption_count,
                SUM(quantity_grams) as total_quantity,
                AVG(carbs) as avg_carbs,
                AVG(protein) as avg_protein,
                AVG(fat) as avg_fat
            FROM daily_food_intake
            WHERE user_id = :user_id
            GROUP BY product_name
            ORDER BY consumption_count DESC
            LIMIT :limit
        """)
        
        result = db.execute(query, {'user_id': user_id, 'limit': limit})
        rows = result.fetchall()
        
        products = []
        for row in rows:
            avg_carbs = float(row[3])
            avg_protein = float(row[4])
            avg_fat = float(row[5])
            
            products.append({
                'product_name': row[0],
                'consumption_count': row[1],
                'total_quantity': float(row[2]),
                'avg_carbs': round(avg_carbs, 2),
                'avg_protein': round(avg_protein, 2),
                'avg_fat': round(avg_fat, 2),
                'avg_calories': calculate_calories(avg_carbs, avg_protein, avg_fat)
            })
        
        return products
