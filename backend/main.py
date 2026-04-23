from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db, Base
import models

# Tabloları oluştur (varsa atla)
# Zaten Supabase'de manuel oluşturduk, bu satır güvenlik önlemi
Base.metadata.create_all(bind=engine)

# FastAPI uygulaması
app = FastAPI(title="Akıllı E-Ticaret API", version="2.0")

# CORS ayarı
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ API ENDPOINTS ============

@app.get("/")
def ana_sayfa():
    """Sağlık kontrolü"""
    return {"mesaj": "Akıllı E-Ticaret API çalışıyor ✅", "versiyon": "2.0 (Veritabanı bağlı)"}


@app.get("/products")
def urunleri_getir(db: Session = Depends(get_db)):
    """Tüm ürünleri veritabanından getirir"""
    urunler = db.query(models.Urun).all()
    
    # SQLAlchemy nesnelerini dict'e çevir (frontend'in anlayacağı formata)
    urunler_listesi = [
        {
            "id": u.id,
            "ad": u.ad,
            "aciklama": u.aciklama,
            "fiyat": float(u.fiyat),  # DECIMAL → float
            "kategori": u.kategori,
            "resim": u.resim_url,
            "stok_adedi": u.stok_adedi
        }
        for u in urunler
    ]
    
    return {"toplam": len(urunler_listesi), "urunler": urunler_listesi}


@app.get("/products/{urun_id}")
def urun_detay(urun_id: int, db: Session = Depends(get_db)):
    """Belirli bir ürünün detaylarını getirir"""
    urun = db.query(models.Urun).filter(models.Urun.id == urun_id).first()
    
    if not urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    return {
        "id": urun.id,
        "ad": urun.ad,
        "aciklama": urun.aciklama,
        "fiyat": float(urun.fiyat),
        "kategori": urun.kategori,
        "resim": urun.resim_url,
        "stok_adedi": urun.stok_adedi
    }


@app.get("/products/kategori/{kategori_adi}")
def kategoriye_gore_urunler(kategori_adi: str, db: Session = Depends(get_db)):
    """Belirli bir kategorideki ürünleri döndürür"""
    urunler = db.query(models.Urun).filter(models.Urun.kategori == kategori_adi).all()
    
    return {
        "kategori": kategori_adi,
        "toplam": len(urunler),
        "urunler": [
            {
                "id": u.id,
                "ad": u.ad,
                "fiyat": float(u.fiyat),
                "resim": u.resim_url
            }
            for u in urunler
        ]
    }


@app.post("/chat")
def sohbet(mesaj: dict):
    """Sohbet asistanı — şimdilik anahtar kelime eşleştirmesi"""
    kullanici_mesaji = mesaj.get("metin", "").lower()

    if "merhaba" in kullanici_mesaji or "selam" in kullanici_mesaji:
        cevap = "Merhaba! Sana nasıl yardımcı olabilirim? 😊"
    elif "mont" in kullanici_mesaji or "kışlık" in kullanici_mesaji:
        cevap = "Kışlık ürünlerimiz arasında deri montumuz ve botumuz öne çıkıyor. İncelemek ister misin?"
    elif "fiyat" in kullanici_mesaji or "ucuz" in kullanici_mesaji:
        cevap = "En uygun fiyatlı ürünümüz 199 TL'den başlayan tişörtlerimiz."
    elif "teşekkür" in kullanici_mesaji:
        cevap = "Rica ederim! Başka bir konuda yardım ister misin?"
    else:
        cevap = "Anladım. Ürünlerimizi incelemek için 'Görsel Ara' sayfasına da göz atabilirsin."

    return {"cevap": cevap}