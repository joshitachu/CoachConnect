from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from database import metadata, engine

Base = declarative_base(metadata=metadata)

class TrainerUser(Base):
    __tablename__ = "trainer_users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50))
    last_name = Column(String(50))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    country = Column(String(50))
    phone_number = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class ClientUser(Base):
    __tablename__ = "client users"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(50))
    last_name = Column(String(50))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))
    country = Column(String(50))
    phone_number = Column(String(20))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

Base.metadata.create_all(bind=engine)
