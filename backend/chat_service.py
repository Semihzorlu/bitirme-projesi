"""
Sohbet Asistanı Servisi (Gemini + CLIP + PostgreSQL)
RAG + Hibrit Arama yaklaşımı:
1. CLIP ile kullanıcı mesajından ilgili ürünler bulunur
2. PostgreSQL full-text search ile metinsel arama
3. Skorlar birleştirilir
4. Gemini'ye ürünler verilir, doğal cevap üretilir
"""

import os
import json
import re
from dotenv import load_dotenv
import google.generativeai as genai
from sqlalchemy import text
from sqlalchemy.orm import Session

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("GEMINI_API_KEY bulunamadı. .env dosyasını kontrol et.")

genai.configure(api_key=API_KEY)

model = genai.GenerativeModel(
    model_name="gemini-flash-latest",
    system_instruction="""Sen 'Akıllı E-Ticaret Asistanı' adlı bir alışveriş asistanısın.

Görevin:
- Kullanıcı mesajını anlamak
- Sana verilen ÜRÜN LİSTESİNDEN en uygun olanları seçmek
- Seçtiklerini doğal bir Türkçe ile önermek

ÇOK ÖNEMLİ: Cevabını HER ZAMAN aşağıdaki JSON formatında ver, başka HİÇBİR şey yazma:

{
  "cevap": "Kullanıcıya gösterilecek doğal Türkçe metin (3-5 cümle, ürün adlarını ve fiyatlarını cümle içinde kullan)",
  "secilen_urun_idleri": [1, 2, 3]
}

Kurallar:
- secilen_urun_idleri'ne SADECE cevapta bahsettiğin ürünlerin ID'lerini koy
- Sadece verilen ürün listesinden seç (uydurma)
- En fazla 3 ürün seç
- Eğer uygun ürün yoksa secilen_urun_idleri boş liste olsun: []
- Fiyatları ₺ olarak göster
- Samimi ve yardımsever ol
- Emoji kullanabilirsin (abartma)

UNUTMA: JSON dışında hiçbir metin yazma. Kod bloğu (```) da kullanma."""
)


def ilgili_urunleri_bul(kullanici_mesaji: str, db: Session, limit: int = 8) -> list:
    """
    Hibrit arama: CLIP vektör araması + PostgreSQL full-text search
    """
    from vector_service import metin_vektoru_cikar
    
    try:
        # ===== 1. VEKTÖR ARAMA (CLIP) =====
        sorgu_vektoru = metin_vektoru_cikar(kullanici_mesaji)
        vektor_str = str(sorgu_vektoru)
        
        vektor_sql = text("""
            SELECT id, ad, aciklama, fiyat, kategori, resim_url,
                   1 - (embedding <=> CAST(:sorgu AS vector)) AS skor
            FROM urunler
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> CAST(:sorgu AS vector)
            LIMIT :limit
        """)
        
        vektor_sonuclar = db.execute(
            vektor_sql, 
            {"sorgu": vektor_str, "limit": limit}
        ).fetchall()
        
        # ===== 2. METİN ARAMA (PostgreSQL FTS) =====
        metin_sql = text("""
            SELECT id, ad, aciklama, fiyat, kategori, resim_url,
                   ts_rank(
                       to_tsvector('simple', 
                           coalesce(ad, '') || ' ' || 
                           coalesce(aciklama, '') || ' ' || 
                           coalesce(kategori, '')
                       ),
                       websearch_to_tsquery('simple', :sorgu)
                   ) AS skor
            FROM urunler
            WHERE to_tsvector('simple', 
                      coalesce(ad, '') || ' ' || 
                      coalesce(aciklama, '') || ' ' || 
                      coalesce(kategori, '')
                  ) @@ websearch_to_tsquery('simple', :sorgu)
            ORDER BY skor DESC
            LIMIT :limit
        """)
        
        try:
            metin_sonuclar = db.execute(
                metin_sql, 
                {"sorgu": kullanici_mesaji, "limit": limit}
            ).fetchall()
        except Exception as e:
            print(f"⚠️ Metin araması başarısız (sorun değil): {e}")
            metin_sonuclar = []
        
        # ===== 3. SONUÇLARI BİRLEŞTİR =====
        urun_skorlari = {}
        
        # Vektör skorları (ağırlık 1.0)
        for row in vektor_sonuclar:
            urun = {
                "id": row.id,
                "ad": row.ad,
                "aciklama": row.aciklama or "",
                "fiyat": float(row.fiyat),
                "kategori": row.kategori or "",
                "resim": row.resim_url or ""
            }
            skor = float(row.skor) * 1.0
            urun_skorlari[row.id] = (skor, urun)
        
        # Metin skorları (ağırlık 1.5 + bonus)
        for row in metin_sonuclar:
            urun = {
                "id": row.id,
                "ad": row.ad,
                "aciklama": row.aciklama or "",
                "fiyat": float(row.fiyat),
                "kategori": row.kategori or "",
                "resim": row.resim_url or ""
            }
            metin_skoru = float(row.skor) * 1.5 + 0.3
            
            if row.id in urun_skorlari:
                mevcut_skor, _ = urun_skorlari[row.id]
                urun_skorlari[row.id] = (mevcut_skor + metin_skoru, urun)
            else:
                urun_skorlari[row.id] = (metin_skoru, urun)
        
        # Skora göre sırala
        siralanmis = sorted(
            urun_skorlari.values(), 
            key=lambda x: x[0], 
            reverse=True
        )
        
        return [urun for _, urun in siralanmis[:limit]]
    
    except Exception as e:
        print(f"⚠️ Ürün arama hatası: {e}")
        return []


def urun_listesini_formatla(urunler: list) -> str:
    """Ürün listesini Gemini için düz metin formatına çevirir."""
    if not urunler:
        return "Şu an uygun ürün bulunamadı."
    
    metin = "Mağazadaki mevcut ürünler:\n\n"
    for u in urunler:
        metin += f"[ID: {u['id']}] {u['ad']} - {u['fiyat']}₺\n"
        metin += f"  Kategori: {u['kategori']}\n"
        if u['aciklama']:
            metin += f"  Açıklama: {u['aciklama']}\n"
        metin += "\n"
    
    return metin


def gemini_cevabini_parse_et(ham_cevap: str) -> dict:
    """Gemini'nin JSON cevabını parse eder."""
    temiz = ham_cevap.strip()
    temiz = re.sub(r'^```json\s*', '', temiz)
    temiz = re.sub(r'^```\s*', '', temiz)
    temiz = re.sub(r'\s*```$', '', temiz)
    temiz = temiz.strip()
    
    try:
        return json.loads(temiz)
    except json.JSONDecodeError:
        return {
            "cevap": ham_cevap,
            "secilen_urun_idleri": []
        }


def sohbet_et(kullanici_mesaji: str, db: Session) -> dict:
    """
    Kullanıcı mesajına RAG yaklaşımıyla cevap üretir.
    """
    try:
        # 1. İlgili ürünleri bul
        urunler = ilgili_urunleri_bul(kullanici_mesaji, db)
        
        if not urunler:
            return {
                "cevap": "Şu an önerebileceğim bir ürün bulamadım. Başka bir şey sorar mısın?",
                "onerilen_urunler": []
            }
        
        # 2. Gemini'ye ürünleri ver
        urun_metni = urun_listesini_formatla(urunler)
        prompt = f"""Kullanıcı mesajı: "{kullanici_mesaji}"

{urun_metni}

Kullanıcıya en uygun ürünleri seç ve JSON formatında cevap ver."""
        
        response = model.generate_content(prompt)
        parsed = gemini_cevabini_parse_et(response.text)
        
        # 3. Seçilen ID'lere göre ürünleri filtrele
        secilen_idler = parsed.get("secilen_urun_idleri", [])
        secilen_urunler = [u for u in urunler if u["id"] in secilen_idler]
        
        # Eğer Gemini hiç seçmediyse ilk 3'ü göster
        if not secilen_urunler and urunler:
            secilen_urunler = urunler[:3]
        
        return {
            "cevap": parsed.get("cevap", response.text),
            "onerilen_urunler": secilen_urunler
        }
    
    except Exception as e:
        print(f"❌ Gemini hatası: {e}")
        return {
            "cevap": "Üzgünüm, şu an size yardımcı olamıyorum. Biraz sonra tekrar deneyin. 🙏",
            "onerilen_urunler": []
        }


def test_baglantisi() -> bool:
    """Gemini API bağlantısını test eder."""
    try:
        response = model.generate_content('Sadece şu JSON\'u döndür: {"cevap": "Merhaba!", "secilen_urun_idleri": []}')
        print(f"✅ Gemini çalışıyor! Test cevabı: {response.text}")
        return True
    except Exception as e:
        print(f"❌ Gemini bağlantı hatası: {e}")
        return False


if __name__ == "__main__":
    test_baglantisi()