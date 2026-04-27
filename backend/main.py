from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import engine, get_db, Base
from chat_service import sohbet_et
import models
from vector_service import resim_vektoru_cikar

# Tabloları oluştur (varsa atla)
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


# ============ ANA ENDPOINTS ============

@app.get("/")
def ana_sayfa():
    """Sağlık kontrolü"""
    return {"mesaj": "Akıllı E-Ticaret API çalışıyor ✅", "versiyon": "2.0 (Veritabanı bağlı)"}


@app.get("/products")
def urunleri_getir(db: Session = Depends(get_db)):
    """Tüm ürünleri veritabanından getirir"""
    urunler = db.query(models.Urun).all()
    
    urunler_listesi = [
        {
            "id": u.id,
            "ad": u.ad,
            "aciklama": u.aciklama,
            "fiyat": float(u.fiyat),
            "kategori": u.kategori,
            "resim": u.resim_url,
            "stok_adedi": u.stok_adedi
        }
        for u in urunler
    ]
    
    return {"toplam": len(urunler_listesi), "urunler": urunler_listesi}


# ============ SABİT URL ENDPOINTS (parametreli URL'lerden ÖNCE) ============
# FastAPI route eşleştirmesinde sabit yollar parametrelilerden önce gelmeli

@app.get("/products/trending")
def trend_urunler(limit: int = 4, gun: int = 7, db: Session = Depends(get_db)):
    """
    Son N günde en çok etkileşim alan ürünleri döndürür.
    
    Skorlama:
    - Görüntüleme: 1 puan
    - Tıklama: 2 puan
    - Sepete ekleme: 5 puan (en güçlü sinyal)
    
    Anasayfadaki "🔥 Trend Olanlar" bölümü için.
    """
    sql = text("""
        SELECT 
            u.id, u.ad, u.aciklama, u.fiyat, u.kategori, u.resim_url,
            COUNT(DISTINCT e.oturum_id) AS tekil_kullanici,
            SUM(
                CASE 
                    WHEN e.etkilesim_tipi = 'sepete_ekleme' THEN 5
                    WHEN e.etkilesim_tipi = 'tiklama' THEN 2
                    ELSE 1
                END
            ) AS trend_skoru
        FROM etkilesimler e
        JOIN urunler u ON u.id = e.urun_id
        WHERE e.tarih > NOW() - (:gun || ' days')::interval
          AND e.oturum_id IS NOT NULL
        GROUP BY u.id, u.ad, u.aciklama, u.fiyat, u.kategori, u.resim_url
        ORDER BY trend_skoru DESC, tekil_kullanici DESC
        LIMIT :limit
    """)
    
    sonuclar = db.execute(sql, {"gun": str(gun), "limit": limit}).fetchall()
    
    trend_listesi = [
        {
            "id": row.id,
            "ad": row.ad,
            "aciklama": row.aciklama or "",
            "fiyat": float(row.fiyat),
            "kategori": row.kategori or "",
            "resim": row.resim_url or "",
            "tekil_kullanici": row.tekil_kullanici,
            "trend_skoru": row.trend_skoru
        }
        for row in sonuclar
    ]
    
    return {
        "mesaj": f"Son {gun} günün trend ürünleri",
        "trend_urunler": trend_listesi
    }


@app.post("/products/add")
def yeni_urun_ekle(urun: dict, db: Session = Depends(get_db)):
    """
    Yeni ürün ekler ve otomatik olarak vektörünü oluşturur.
    """
    from vector_service import url_den_vektor_cikar
    
    gerekli_alanlar = ["ad", "fiyat", "resim_url"]
    for alan in gerekli_alanlar:
        if alan not in urun or not urun[alan]:
            raise HTTPException(
                status_code=400,
                detail=f"'{alan}' alanı zorunlu"
            )
    
    yeni = models.Urun(
        ad=urun["ad"],
        aciklama=urun.get("aciklama", ""),
        fiyat=urun["fiyat"],
        kategori=urun.get("kategori", ""),
        resim_url=urun["resim_url"],
        stok_adedi=urun.get("stok_adedi", 0)
    )
    
    print(f"🤖 Yeni ürün için vektör oluşturuluyor: {yeni.ad}")
    vektor = url_den_vektor_cikar(yeni.resim_url)
    
    if vektor is None:
        raise HTTPException(
            status_code=400,
            detail="Resim URL'si işlenemedi. Geçerli bir görsel linki mi?"
        )
    
    yeni.embedding = vektor
    
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
    Vektörü olmayan ürünleri bulur ve otomatik vektör oluşturur.
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


# ============ PARAMETRELİ URL ENDPOINTS (sabitlerden SONRA) ============

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


@app.get("/products/{urun_id}/similar")
def benzer_urunler(urun_id: int, limit: int = 6, db: Session = Depends(get_db)):
    """
    Bir ürüne benzer ürünleri pgvector + kategori önceliği ile bulur.
    
    Tiered Re-Ranking:
    1. Aynı kategori (en üstte)
    2. İlişkili kategori (orta)  
    3. Farklı kategori (en altta)
    """
    urun = db.query(models.Urun).filter(models.Urun.id == urun_id).first()
    
    if not urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    
    if urun.embedding is None:
        return {
            "mesaj": "Bu ürün için henüz öneri hazır değil",
            "benzer_urunler": []
        }
    
    aday_sql = text("""
        SELECT id, ad, aciklama, fiyat, kategori, resim_url,
               1 - (embedding <=> (
                   SELECT embedding FROM urunler WHERE id = :urun_id
               )) AS gorsel_benzerlik
        FROM urunler
        WHERE id != :urun_id 
          AND embedding IS NOT NULL
        ORDER BY embedding <=> (
            SELECT embedding FROM urunler WHERE id = :urun_id
        )
        LIMIT :geniş_limit
    """)
    
    adaylar = db.execute(
        aday_sql, 
        {"urun_id": urun_id, "geniş_limit": limit * 4}
    ).fetchall()
    
    kategori_gruplari = {
        "Üst Giyim": ["Üst Giyim", "Dış Giyim"],
        "Alt Giyim": ["Alt Giyim"],
        "Dış Giyim": ["Dış Giyim", "Üst Giyim"],
        "Ayakkabı": ["Ayakkabı"],
        "Aksesuar": ["Aksesuar"],
    }
    
    hedef_kategori = urun.kategori
    iliski_kategorileri = kategori_gruplari.get(hedef_kategori, [hedef_kategori])
    
    ayni_kategori = []
    iliskili_kategori = []
    farkli_kategori = []
    
    for row in adaylar:
        gorsel_skor = float(row.gorsel_benzerlik)
        
        urun_dict = {
            "id": row.id,
            "ad": row.ad,
            "aciklama": row.aciklama or "",
            "fiyat": float(row.fiyat),
            "kategori": row.kategori or "",
            "resim": row.resim_url or "",
            "ham_skor": gorsel_skor
        }
        
        if row.kategori == hedef_kategori:
            ayni_kategori.append(urun_dict)
        elif row.kategori in iliski_kategorileri:
            iliskili_kategori.append(urun_dict)
        else:
            farkli_kategori.append(urun_dict)
    
    ayni_kategori.sort(key=lambda x: x["ham_skor"], reverse=True)
    iliskili_kategori.sort(key=lambda x: x["ham_skor"], reverse=True)
    farkli_kategori.sort(key=lambda x: x["ham_skor"], reverse=True)
    
    siralanmis = ayni_kategori + iliskili_kategori + farkli_kategori
    siralanmis = siralanmis[:limit]
    
    sonuc = []
    for urun_dict in siralanmis:
        if urun_dict in ayni_kategori:
            yuzde = 75 + (urun_dict["ham_skor"] * 20)
        elif urun_dict in iliskili_kategori:
            yuzde = 55 + (urun_dict["ham_skor"] * 20)
        else:
            yuzde = 35 + (urun_dict["ham_skor"] * 20)
        
        sonuc.append({
            "id": urun_dict["id"],
            "ad": urun_dict["ad"],
            "aciklama": urun_dict["aciklama"],
            "fiyat": urun_dict["fiyat"],
            "kategori": urun_dict["kategori"],
            "resim": urun_dict["resim"],
            "benzerlik": round(min(yuzde, 95), 1)
        })
    
    return {
        "mesaj": f"{len(sonuc)} benzer ürün bulundu",
        "benzer_urunler": sonuc
    }


@app.get("/products/{urun_id}/also-viewed")
def beraber_incelenenler(urun_id: int, limit: int = 6, db: Session = Depends(get_db)):
    """
    "Bu ürünü inceleyenler şunları da inceledi" - Item-Item Collaborative Filtering.
    """
    sql = text("""
        WITH bu_urunu_gorenler AS (
            SELECT DISTINCT oturum_id 
            FROM etkilesimler
            WHERE urun_id = :urun_id
              AND oturum_id IS NOT NULL
        )
        SELECT 
            u.id, u.ad, u.aciklama, u.fiyat, u.kategori, u.resim_url,
            COUNT(DISTINCT e.oturum_id) AS ortak_kullanici_sayisi
        FROM etkilesimler e
        JOIN urunler u ON u.id = e.urun_id
        WHERE e.urun_id != :urun_id
          AND e.oturum_id IN (SELECT oturum_id FROM bu_urunu_gorenler)
        GROUP BY u.id, u.ad, u.aciklama, u.fiyat, u.kategori, u.resim_url
        ORDER BY ortak_kullanici_sayisi DESC
        LIMIT :limit
    """)
    
    sonuclar = db.execute(sql, {"urun_id": urun_id, "limit": limit}).fetchall()
    
    beraber_urunler = [
        {
            "id": row.id,
            "ad": row.ad,
            "aciklama": row.aciklama or "",
            "fiyat": float(row.fiyat),
            "kategori": row.kategori or "",
            "resim": row.resim_url or "",
            "ortak_kullanici": row.ortak_kullanici_sayisi
        }
        for row in sonuclar
    ]
    
    return {
        "mesaj": f"{len(beraber_urunler)} ürün bulundu",
        "beraber_incelenenler": beraber_urunler
    }


# ============ DİĞER POST ENDPOINTS ============

@app.post("/chat")
def sohbet(mesaj: dict, db: Session = Depends(get_db)):
    """
    Sohbet asistanı — RAG (CLIP + Gemini + pgvector)
    """
    kullanici_mesaji = mesaj.get("metin", "").strip()
    
    if not kullanici_mesaji:
        return {"cevap": "Lütfen bir mesaj yaz 😊", "onerilen_urunler": []}
    
    sonuc = sohbet_et(kullanici_mesaji, db)
    
    return sonuc


@app.post("/visual-search")
async def gorsel_ara(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Yüklenen fotoğrafa en benzer ürünleri bulur.
    CLIP ile vektör çıkarır, pgvector ile benzerlik araması yapar.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Lütfen bir resim dosyası yükle")
    
    resim_bytes = await file.read()
    
    try:
        sorgu_vektoru = resim_vektoru_cikar(resim_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resim işlenemedi: {str(e)}")
    
    sql = text("""
        SELECT id, ad, aciklama, fiyat, kategori, resim_url,
               1 - (embedding <=> CAST(:sorgu AS vector)) AS benzerlik
        FROM urunler
        WHERE embedding IS NOT NULL
        ORDER BY embedding <=> CAST(:sorgu AS vector)
        LIMIT 5
    """)
    
    vektor_str = str(sorgu_vektoru)
    sonuclar = db.execute(sql, {"sorgu": vektor_str}).fetchall()
    
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
    
    if ham_sonuclar:
        en_yuksek = ham_sonuclar[0]["ham_benzerlik"]
        en_dusuk = min(r["ham_benzerlik"] for r in ham_sonuclar)
        fark = en_yuksek - en_dusuk
        
        benzer_urunler = []
        for row in ham_sonuclar:
            if fark < 0.01:
                yuzde = round(row["ham_benzerlik"] * 100, 1)
            else:
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


@app.post("/interactions/track")
def etkilesim_kaydet(veri: dict, db: Session = Depends(get_db)):
    """
    Kullanıcı etkileşimini kaydeder.
    Etkileşim tipleri: 'goruntuleme', 'tiklama', 'sepete_ekleme'
    """
    oturum_id = veri.get("oturum_id")
    urun_id = veri.get("urun_id")
    etkilesim_tipi = veri.get("etkilesim_tipi", "goruntuleme")
    
    if not oturum_id or not urun_id:
        raise HTTPException(status_code=400, detail="oturum_id ve urun_id gerekli")
    
    # Aynı oturum aynı ürünü 5 dakika içinde tekrar görüntülemişse kaydetme
    son_etkilesim = db.execute(text("""
        SELECT id FROM etkilesimler
        WHERE oturum_id = :oturum_id 
          AND urun_id = :urun_id 
          AND etkilesim_tipi = :tipi
          AND tarih > NOW() - INTERVAL '5 minutes'
        LIMIT 1
    """), {
        "oturum_id": oturum_id,
        "urun_id": urun_id,
        "tipi": etkilesim_tipi
    }).fetchone()
    
    if son_etkilesim:
        return {"mesaj": "Yakın zamanda kaydedilmiş, atlandı", "kaydedildi": False}
    
    yeni_etkilesim = models.Etkilesim(
        oturum_id=oturum_id,
        urun_id=urun_id,
        etkilesim_tipi=etkilesim_tipi
    )
    db.add(yeni_etkilesim)
    db.commit()
    
    return {"mesaj": "Etkileşim kaydedildi", "kaydedildi": True}