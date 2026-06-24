# ANDRE & LULU ❤️

Website romantis premium dengan sinkronisasi realtime lintas device menggunakan Firebase.

## Fitur

- **Realtime Sync** — Semua perubahan (foto, lagu, timeline, kata cinta, musik) langsung muncul di semua device tanpa refresh
- **Upload Kilat ⚡** — Foto dikompres otomatis (maks 1200px, ~200-400KB) untuk upload super cepat ke Firebase
- **Love Music** — Musik background autoplay, bisa pause/play, realtime untuk semua pengunjung
- **Galeri Foto** — Masonry grid dengan lightbox, upload ke Firebase Storage
- **Spotify** — Embed track/album/playlist otomatis
- **Timeline Cinta** — Kisah perjalanan hubungan
- **Kata-Kata Cinta** — Kutipan romantis yang berputar
- **Admin Dashboard** — CRUD lengkap dengan realtime sync
- **Login** — Password only (AndreLulu#2022*)

## Setup Firebase (WAJIB untuk realtime lintas device)

### 1. Buat Project Firebase
1. Buka [Firebase Console](https://console.firebase.google.com)
2. Klik "Add project" → ikuti wizard
3. Aktifkan **Firestore Database**, **Storage**, dan **Authentication**

### 2. Dapatkan Config Firebase
1. Di Firebase Console → Project Settings → General
2. Scroll ke "Your apps" → Web app → Klik icon `</>`
3. Copy config object

### 3. Isi Environment Variables

```bash
cp .env.example .env
```

Isi file `.env` dengan config Firebase kamu:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=andre-lulu.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=andre-lulu
VITE_FIREBASE_STORAGE_BUCKET=andre-lulu.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 4. Firestore Security Rules

Di Firebase Console → Firestore Database → Rules, paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

> ⚠️ Untuk production, ganti rules dengan autentikasi yang lebih ketat.

### 5. Firebase Storage Rules

Di Firebase Console → Storage → Rules, paste:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

### 6. Jalankan Project

```bash
npm install
npm run dev
```

### 7. Deploy ke Vercel

```bash
npm run build
# atau deploy via Vercel CLI
vercel --prod
```

## Struktur Firestore

Collections:
- `photos` — metadata foto (imageUrl, caption, description, createdAt)
- `songs` — Spotify URLs (spotifyUrl, title, note, createdAt)
- `events` — timeline events (date, title, description, icon, createdAt)
- `loveWords` — quotes (quote, author, createdAt)
- `settings/site` — website settings (backgroundMusicUrl, backgroundMusicTitle, heroTitle, heroSubtitle, anniversaryISO)

## Cara Kerja Realtime

Semua data di-fetch menggunakan `onSnapshot()` dari Firebase Firestore. Ketika:
- Andre upload foto dari laptop → Lulu lihat langsung di HP
- Admin ganti musik → Semua pengunjung langsung dengar lagu baru
- Edit timeline → Update muncul di semua tab/browser/device

Tanpa refresh. Tanpa localStorage. Murni Firebase realtime.

## Demo Mode

Jika Firebase config belum diisi, website berjalan dalam Demo Mode (in-memory) dengan sinkron antar-tab via BroadcastChannel. Untuk sinkron lintas device, wajib setup Firebase.

## Password Admin

```
AndreLulu#2022*
```

---

Dibuat dengan ❤️ untuk Andre & Lulu
