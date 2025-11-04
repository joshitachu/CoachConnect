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
def check_login(email: str, password: str) -> bool:
    """
    Check if a user with the given email and password exists.
    Returns True if credentials are valid, else False.
    """
    email = _sanitize_email(email)
    print(email, password)
    with SessionLocal() as db:
        row = db.execute(
            text("SELECT * FROM trainer_user WHERE email = :email "),
            {"email": email, "password": password}
        ).fetchone()

        print("DB query result:", row)
        return bool(row)
    

def check_login_client(email: str, password: str) -> bool:
    """
    Check if a client user with the given email and password exists.
    Returns True if credentials are valid, else False.
    """
    email = _sanitize_email(email)
    print(email, password)
    with SessionLocal() as db:
        row = db.execute(
            text("SELECT * FROM client_user WHERE email = :email "),
            {"email": email, "password": password}
        ).fetchone()

        print("DB query result:", row)
        return bool(row)
    

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
    


