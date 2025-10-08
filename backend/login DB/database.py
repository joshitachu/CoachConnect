from sqlalchemy import create_engine, MetaData, text
from sqlalchemy.orm import sessionmaker

DB_USER = "root"
DB_PASSWORD = "Windesheim2004"
DB_HOST = "localhost"
DB_NAME = "coachconnect_db"

DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
metadata = MetaData()

def test_connection():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT NOW();"))
            print("Database verbinding succesvol:", result.fetchone())
    except Exception as e:
        print("Fout bij verbinden met database:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_connection()
