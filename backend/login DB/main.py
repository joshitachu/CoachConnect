from fastapi import FastAPI, Depends, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import SessionLocal
from models import TrainerUser, ClientUser
from passlib.context import CryptContext

app = FastAPI()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

origins = ["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/signup")
def signup(
    first_name: str = Form(...),
    last_name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    country: str = Form(...),
    phone_number: str = Form(...),
    role: str = Form("client"),
    db: Session = Depends(get_db)
):
    hashed_password = pwd_context.hash(password[:72])
    
    if role == "trainer":
        if db.query(TrainerUser).filter(TrainerUser.email == email).first():
            raise HTTPException(status_code=400, detail="Email already exists in trainer database")
        
        user = TrainerUser(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hashed_password,
            country=country,
            phone_number=phone_number
        )
    else:
        if db.query(ClientUser).filter(ClientUser.email == email).first():
            raise HTTPException(status_code=400, detail="Email already exists in client database")
        
        user = ClientUser(
            first_name=first_name,
            last_name=last_name,
            email=email,
            password=hashed_password,
            country=country,
            phone_number=phone_number
        )
    
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": f"{role.capitalize()} account created", "user_id": user.id, "role": role}

@app.post("/login")
def login(
    email: str = Form(...), 
    password: str = Form(...), 
    role: str = Form(...),
    db: Session = Depends(get_db)
):
    user = None
    
    if role == "trainer":
        user = db.query(TrainerUser).filter(TrainerUser.email == email).first()
    else:
        user = db.query(ClientUser).filter(ClientUser.email == email).first()
    
    if not user or not pwd_context.verify(password, user.password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {
        "message": f"Welcome {user.first_name}",
        "user": {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "country": user.country,
            "phone_number": user.phone_number,
            "role": role
        }
    }
