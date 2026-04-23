"""
Görsel Arama Servisi - CLIP Modeli
OpenAI CLIP modelini kullanarak görsellerden semantik vektör çıkarır.
Moda ürünleri için ResNet50'ye göre çok daha başarılıdır.
"""

import numpy as np
from PIL import Image
from io import BytesIO
import requests

from sentence_transformers import SentenceTransformer

# CLIP modelini yükle (ilk seferinde internetten iner, ~350 MB)
# "clip-ViT-B-32" → OpenAI CLIP'in en yaygın kullanılan sürümü
# 512 boyutlu vektör üretir
print("🤖 CLIP modeli yükleniyor... (ilk seferinde internetten iniyor)")
model = SentenceTransformer('clip-ViT-B-32')
print("✅ CLIP modeli hazır!")


def resim_vektoru_cikar(resim_bytes: bytes) -> list[float]:
    """
    Bir resim dosyasından 512 boyutlu CLIP vektörü çıkarır.
    Otomatik olarak normalize edilmiş vektör döner.
    """
    img = Image.open(BytesIO(resim_bytes)).convert('RGB')
    
    # CLIP ile vektör çıkar (normalize=True → cosine similarity için uygun)
    vector = model.encode(img, normalize_embeddings=True)
    
    return vector.tolist()


def url_den_vektor_cikar(url: str) -> list[float] | None:
    """İnternetteki bir resim URL'sinden CLIP vektörü çıkarır."""
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return resim_vektoru_cikar(response.content)
    except Exception as e:
        print(f"⚠️ URL okunamadı: {url} | Hata: {e}")
        return None


def metin_vektoru_cikar(metin: str) -> list[float]:
    """
    Bir metinden CLIP vektörü çıkarır.
    Örn: 'kırmızı spor ayakkabı' → 512 boyutlu vektör
    Görsel ve metin vektörleri aynı uzayda olduğu için birbirleriyle karşılaştırılabilir.
    Bonus özellik: Metinle ürün arama (gelecekte kullanılabilir).
    """
    vector = model.encode(metin, normalize_embeddings=True)
    return vector.tolist()