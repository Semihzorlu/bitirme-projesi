import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# .env dosyasını yükle
load_dotenv()

# Veritabanı bağlantı metnini al
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL bulunamadı. .env dosyasını kontrol et.")

# SQLAlchemy motoru oluştur
engine = create_engine(DATABASE_URL)

# Her istek için ayrı bir veritabanı oturumu (session) açacağız
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Tüm modeller bu Base'den türeyecek
Base = declarative_base()


# Bu fonksiyon her API isteğinde çağrılacak
# İstek bitince oturumu otomatik kapatır (güvenlik + performans)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()