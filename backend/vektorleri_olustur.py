"""
Tek seferlik script:
Veritabanındaki tüm ürünler için vektör (embedding) oluşturur.
Sadece henüz vektörü olmayan ürünleri işler.
"""

from database import SessionLocal
import models
from vector_service import url_den_vektor_cikar


def tum_urunlerin_vektorlerini_olustur():
    db = SessionLocal()
    
    try:
        urunler = db.query(models.Urun).filter(models.Urun.embedding == None).all()
        
        if not urunler:
            print("✅ Tüm ürünlerin zaten vektörü var!")
            return
        
        print(f"📦 {len(urunler)} ürün için vektör oluşturulacak...\n")
        
        basarili = 0
        basarisiz = 0
        
        for i, urun in enumerate(urunler, 1):
            print(f"[{i}/{len(urunler)}] {urun.ad} işleniyor...")
            
            if not urun.resim_url:
                print(f"   ⚠️ Resim URL'si yok, atlanıyor")
                basarisiz += 1
                continue
            
            vektor = url_den_vektor_cikar(urun.resim_url)
            
            if vektor is None:
                print(f"   ❌ Vektör çıkarılamadı")
                basarisiz += 1
                continue
            
            urun.embedding = vektor
            db.commit()
            print(f"   ✅ Vektör kaydedildi (boyut: {len(vektor)})")
            basarili += 1
        
        print(f"\n🎯 Tamamlandı!")
        print(f"   Başarılı: {basarili}")
        print(f"   Başarısız: {basarisiz}")
    
    finally:
        db.close()


if __name__ == "__main__":
    tum_urunlerin_vektorlerini_olustur()