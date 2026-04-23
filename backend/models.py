from sqlalchemy import Column, Integer, String, Text, DECIMAL, TIMESTAMP, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Urun(Base):
    """Ürünler tablosu için model"""
    __tablename__ = "urunler"

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(255), nullable=False)
    aciklama = Column(Text)
    fiyat = Column(DECIMAL(10, 2), nullable=False)
    kategori = Column(String(100))
    resim_url = Column(Text)
    stok_adedi = Column(Integer, default=0)
    olusturulma_tarihi = Column(TIMESTAMP, server_default=func.now())


class Kullanici(Base):
    """Kullanıcılar tablosu için model"""
    __tablename__ = "kullanicilar"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    sifre_hash = Column(String(255), nullable=False)
    ad = Column(String(100))
    kayit_tarihi = Column(TIMESTAMP, server_default=func.now())


class Etkilesim(Base):
    """Kullanıcı-ürün etkileşimleri (ilerde öneri sistemi için)"""
    __tablename__ = "etkilesimler"

    id = Column(Integer, primary_key=True, index=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"))
    urun_id = Column(Integer, ForeignKey("urunler.id"))
    etkilesim_tipi = Column(String(50))
    tarih = Column(TIMESTAMP, server_default=func.now())