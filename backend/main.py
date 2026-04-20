from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# FastAPI uygulamasını başlat
app = FastAPI(title="Akıllı E-Ticaret API", version="1.0")

# CORS Ayarı: Frontend'in (localhost:5173) backend'e erişmesine izin ver
# Bu olmadan tarayıcı güvenlik nedeniyle bağlantıyı engeller
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ ÖRNEK ÜRÜN VERİSİ (Şimdilik hafızada) ============
# Not: Veritabanını sonraki adımda bağlayacağız
urunler_db = [
    {"id": 1, "ad": "Deri Mont", "fiyat": 1299, "kategori": "Dış Giyim",
     "resim": "https://placehold.co/300x400/222/fff?text=Mont",
     "aciklama": "Gerçek deri, su geçirmez kışlık mont."},
    {"id": 2, "ad": "Kışlık Bot", "fiyat": 899, "kategori": "Ayakkabı",
     "resim": "https://placehold.co/300x400/444/fff?text=Bot",
     "aciklama": "Termal astar, kaymaz taban."},
    {"id": 3, "ad": "Kazak", "fiyat": 449, "kategori": "Üst Giyim",
     "resim": "https://placehold.co/300x400/666/fff?text=Kazak",
     "aciklama": "%100 yün, nefes alabilir kumaş."},
    {"id": 4, "ad": "Pantolon", "fiyat": 599, "kategori": "Alt Giyim",
     "resim": "https://placehold.co/300x400/888/fff?text=Pantolon",
     "aciklama": "Slim fit, dayanıklı pamuklu."},
    {"id": 5, "ad": "Tişört", "fiyat": 199, "kategori": "Üst Giyim",
     "resim": "https://placehold.co/300x400/aaa/fff?text=Tisort",
     "aciklama": "Oversize kesim, %100 pamuk."},
    {"id": 6, "ad": "Sneaker", "fiyat": 1499, "kategori": "Ayakkabı",
     "resim": "https://placehold.co/300x400/ccc/333?text=Sneaker",
     "aciklama": "Günlük kullanım için hafif spor ayakkabı."},
]


# ============ API ENDPOINTS (Uç Noktalar) ============

@app.get("/")
def ana_sayfa():
    """Sağlık kontrolü — API çalışıyor mu?"""
    return {"mesaj": "Akıllı E-Ticaret API çalışıyor ✅"}


@app.get("/products")
def urunleri_getir():
    """Tüm ürünleri döndürür"""
    return {"toplam": len(urunler_db), "urunler": urunler_db}


@app.get("/products/{urun_id}")
def urun_detay(urun_id: int):
    """Belirli bir ürünün detaylarını döndürür"""
    for urun in urunler_db:
        if urun["id"] == urun_id:
            return urun
    return {"hata": "Ürün bulunamadı"}


@app.post("/chat")
def sohbet(mesaj: dict):
    """
    Sohbet asistanı endpoint'i
    Şimdilik basit cevaplar veriyor, ilerde OpenAI/Gemini API'ye bağlayacağız
    """
    kullanici_mesaji = mesaj.get("metin", "").lower()

    # Basit anahtar kelime eşleştirmesi
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