from sqlalchemy import create_engine, text, bindparam   # <-- added bindparam
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import JSONB        # <-- added JSONB
from dotenv import load_dotenv
import os, json

# --- Config ---
load_dotenv()
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://coach_user:voetbal123@192.168.1.100:5432/coachconnect",
)


EXAMPLE_FORM = {
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

def upsert_coach_and_get_id(db, coach_email: str):
    row = db.execute(
        text("""
            INSERT INTO coaches (name, email)
            VALUES (:name, :email)
            ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
        """),
        {"name": coach_email.split("@")[0].title(), "email": coach_email},
    ).fetchone()
    return row[0]

def insert_onboarding_form(coach_email: str, form_dict: dict):
    """Upsert coach by email, then insert a form row."""
    with SessionLocal() as db:
        coach_id = upsert_coach_and_get_id(db, coach_email)

        # --- FIX: bind :form as JSONB (no CAST) ---
        stmt = (
            text("""
                INSERT INTO onboarding_forms (coachid, form_a)
                VALUES (:coachid, :form)
            """)
            .bindparams(bindparam("form", type_=JSONB))
        )

        db.execute(stmt, {"coachid": coach_id, "form": form_dict})
        db.commit()
        return {"status": "success", "coach_id": str(coach_id)}

def list_coaches():
    with SessionLocal() as db:
        rows = db.execute(text("SELECT * FROM coaches ")).fetchall()
        return [dict(r._mapping) for r in rows]

def get_forms_by_coach_email(coach_email: str):
    with SessionLocal() as db:
        rows = db.execute(
            text("""
                SELECT f.id, f.form_a, f.created_at
                FROM onboarding_forms f
                JOIN coaches c ON c.id = f.coachid
                WHERE c.email = :email
                ORDER BY f.created_at DESC
            """),
            {"email": coach_email},
        ).fetchall()
        # psycopg2 usually returns dicts for JSONB already; keep a fallback just in case
        out = []
        for r in rows:
            m = dict(r._mapping)
            if isinstance(m["form_a"], str):
                try:
                    m["form_a"] = json.loads(m["form_a"])
                except Exception:
                    pass
            out.append(m)
        return out

# --- Script usage ---
if __name__ == "__main__":
    print(list_coaches())
