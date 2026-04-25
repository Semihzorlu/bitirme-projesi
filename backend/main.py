from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, get_db, Base
from chat_service import sohbet_et
import models
from vector_service import resim_vektoru_cikar

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
def sohbet(mesaj: dict, db: Session = Depends(get_db)):
    """
    Sohbet asistanı — RAG (CLIP + Gemini + pgvector)
    """
    kullanici_mesaji = mesaj.get("metin", "").strip()
    
    if not kullanici_mesaji:
        return {"cevap": "Lütfen bir mesaj yaz 😊", "onerilen_urunler": []}
    
    from chat_service import sohbet_et
    sonuc = sohbet_et(kullanici_mesaji, db)
    
    return sonuc

@app.post("/visual-search")
async def gorsel_ara(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Yüklenen fotoğrafa en benzer ürünleri bulur.
    ResNet50 ile vektör çıkarır, pgvector ile benzerlik araması yapar.
    """
    # Dosyanın resim olup olmadığını kontrol et
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Lütfen bir resim dosyası yükle")
    
    # Dosyayı oku
    resim_bytes = await file.read()
    
    # Vektörü çıkar
    try:
        sorgu_vektoru = resim_vektoru_cikar(resim_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resim işlenemedi: {str(e)}")
    
    # pgvector ile en benzer 5 ürünü bul
    # <=> operatörü = cosine distance (0'a yakın = çok benzer)
    sql = text("""
        SELECT id, ad, aciklama, fiyat, kategori, resim_url,
               1 - (embedding <=> CAST(:sorgu AS vector)) AS benzerlik
        FROM urunler
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> CAST(:sorgu AS vector)
        LIMIT 5
    """)
    
    # Vektörü PostgreSQL formatına çevir
    vektor_str = str(sorgu_vektoru)
    
    sonuclar = db.execute(sql, {"sorgu": vektor_str}).fetchall()
    
    # Sonuçları JSON formatına dönüştür
    # Ham benzerlik skorlarını topla
    # Ham benzerlik skorlarını topla
    ham_sonuclar = [
        {
            "id": row.id,
            "ad": row.ad,
            "aciklama": row.aciklama,
            "fiyat": float(row.fiyat),
            "kategori": row.kategori,
            "resim": row.resim_url,
            "ham_benzerlik": float(row.benzerlik)
        }
        for row in sonuclar
    ]
    
    # Göreceli benzerlik: En yüksek skoru ~%95'e, en düşüğü ~%50'ye normalize et
    # Böylece kullanıcıya aradaki farklar daha belirgin gösterilir
    if ham_sonuclar:
        en_yuksek = ham_sonuclar[0]["ham_benzerlik"]
        en_dusuk = min(r["ham_benzerlik"] for r in ham_sonuclar)
        fark = en_yuksek - en_dusuk
        
        benzer_urunler = []
        for row in ham_sonuclar:
            if fark < 0.01:
                # Skorlar birbirine çok yakın → ham değer * 100
                yuzde = round(row["ham_benzerlik"] * 100, 1)
            else:
                # Normalize: en yüksek %95, en düşük %50 civarı
                normalized = (row["ham_benzerlik"] - en_dusuk) / fark
                yuzde = round(50 + normalized * 45, 1)
            
            benzer_urunler.append({
                "id": row["id"],
                "ad": row["ad"],
                "aciklama": row["aciklama"],
                "fiyat": row["fiyat"],
                "kategori": row["kategori"],
                "resim": row["resim"],
                "benzerlik": yuzde
            })
    else:
        benzer_urunler = []
    
    return {
        "mesaj": f"{len(benzer_urunler)} benzer ürün bulundu",
        "sonuclar": benzer_urunler
    }
@app.post("/products/add")
def yeni_urun_ekle(urun: dict, db: Session = Depends(get_db)):
    """
    Yeni ürün ekler ve otomatik olarak vektörünü oluşturur.
    
    Body (JSON):
    {
        "ad": "Yeni Mont",
        "aciklama": "Açıklama...",
        "fiyat": 899.00,
        "kategori": "Dış Giyim",
        "resim_url": "https://...",
        "stok_adedi": 10
    }
    """
    from vector_service import url_den_vektor_cikar
    
    # Zorunlu alanları kontrol et
    gerekli_alanlar = ["ad", "fiyat", "resim_url"]
    for alan in gerekli_alanlar:
        if alan not in urun or not urun[alan]:
            raise HTTPException(
                status_code=400,
                detail=f"'{alan}' alanı zorunlu"
            )
    
    # Yeni ürün nesnesi oluştur
    yeni = models.Urun(
        ad=urun["ad"],
        aciklama=urun.get("aciklama", ""),
        fiyat=urun["fiyat"],
        kategori=urun.get("kategori", ""),
        resim_url=urun["resim_url"],
        stok_adedi=urun.get("stok_adedi", 0)
    )
    
    # Vektörü otomatik oluştur
    print(f"🤖 Yeni ürün için vektör oluşturuluyor: {yeni.ad}")
    vektor = url_den_vektor_cikar(yeni.resim_url)
    
    if vektor is None:
        raise HTTPException(
            status_code=400,
            detail="Resim URL'si işlenemedi. Geçerli bir görsel linki mi?"
        )
    
    yeni.embedding = vektor
    
    # Veritabanına kaydet
    db.add(yeni)
    db.commit()
    db.refresh(yeni)
    
    return {
        "mesaj": "✅ Ürün başarıyla eklendi ve vektörü oluşturuldu",
        "urun": {
            "id": yeni.id,
            "ad": yeni.ad,
            "fiyat": float(yeni.fiyat),
            "kategori": yeni.kategori,
            "resim": yeni.resim_url
        }
    }


@app.post("/products/refresh-vectors")
def eksik_vektorleri_olustur(db: Session = Depends(get_db)):
    """
    Veritabanında vektörü olmayan (embedding=NULL) ürünleri bulur
    ve otomatik olarak vektörlerini oluşturur.
    
    Bu endpoint; Supabase panelinden manuel ürün eklediğinde
    ya da bir ürünün resim_url'i değiştiğinde kullanılabilir.
    """
    from vector_service import url_den_vektor_cikar
    
    eksik_urunler = db.query(models.Urun).filter(models.Urun.embedding == None).all()
    
    if not eksik_urunler:
        return {
            "mesaj": "✅ Tüm ürünlerin vektörü zaten var",
            "islem_yapilan": 0
        }
    
    basarili = 0
    basarisiz = []
    
    for urun in eksik_urunler:
        if not urun.resim_url:
            basarisiz.append({"id": urun.id, "ad": urun.ad, "sebep": "Resim URL'si yok"})
            continue
        
        vektor = url_den_vektor_cikar(urun.resim_url)
        
        if vektor is None:
            basarisiz.append({"id": urun.id, "ad": urun.ad, "sebep": "Resim işlenemedi"})
            continue
        
        urun.embedding = vektor
        db.commit()
        basarili += 1
    
    return {
        "mesaj": f"✅ {basarili} ürünün vektörü oluşturuldu",
        "basarili": basarili,
        "basarisiz": basarisiz,
        "toplam_islenen": len(eksik_urunler)
    }