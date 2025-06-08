# Mesajlaşma Uygulaması

Bu proje, gerçek zamanlı mesajlaşma özellikleri sunan bir web uygulamasıdır.

## Kullanılan Teknolojiler ve Kütüphaneler

### Backend
- Node.js
- Express.js
- Socket.IO (Gerçek zamanlı iletişim için)
- JSON Web Token (JWT) (Kimlik doğrulama için)

### Frontend
- React
- React Native
- Expo
- Socket.IO-client
- React Navigation
- AsyncStorage

### Protokoller
- WebSocket (Socket.IO üzerinden)
- HTTP/HTTPS
- REST API

## Proje Yapısı

Her dosyanın başında, o dosyanın amacını ve kullanılan teknolojileri açıklayan yorum satırları bulunmaktadır.

### Önemli Dosyalar
- `server.js`: Ana sunucu dosyası
- `App.js`: React uygulamasının ana bileşeni
- `src/`: Kaynak kodların bulunduğu dizin
- `messages.json`: Mesaj verilerinin saklandığı dosya

## Kurulum

1. Projeyi klonlayın
2. `npm install` komutunu çalıştırın
3. Gerekli ortam değişkenlerini ayarlayın
4. `npm start` ile uygulamayı başlatın

## Güvenlik

Hassas bilgiler (API anahtarları, veritabanı bağlantı bilgileri vb.) `.env` dosyasında saklanmaktadır ve bu dosya `.gitignore` ile GitHub'a yüklenmeyecektir. 