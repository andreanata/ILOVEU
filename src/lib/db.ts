import {
  collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc,
  query, orderBy, setDoc, getDoc,
  type Unsubscribe
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, firebaseEnabled } from "./firebase";
import { broadcast, onBroadcast } from "./live-sync";

// Types
export type Photo = {
  id: string;
  imageUrl: string;
  caption: string;
  description?: string;
  createdAt: number;
};

export type Song = {
  id: string;
  spotifyUrl: string;
  title?: string;
  note?: string;
  createdAt: number;
};

export type LoveEvent = {
  id: string;
  date: string; // ISO
  title: string;
  description: string;
  icon?: string;
  createdAt: number;
};

export type LoveWord = {
  id: string;
  quote: string;
  author?: string;
  createdAt: number;
};

export type SiteSettings = {
  backgroundMusicUrl: string;
  backgroundMusicTitle: string;
  heroTitle: string;
  heroSubtitle: string;
  anniversaryISO: string;
};

// --- Mock Realtime Store (demo mode, in-memory, no localStorage) ---
type StoreTables = {
  photos: Photo[];
  songs: Song[];
  events: LoveEvent[];
  loveWords: LoveWord[];
  settings: SiteSettings;
};

const seedPhotos: Photo[] = [
  { id: "p1", imageUrl: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=1200&auto=format&fit=crop", caption: "Sore di Florence", description: "Gelato pertama kita berdua, jalan bergandengan di Piazza.", createdAt: Date.now() - 1000*60*60*24*20 },
  { id: "p2", imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1200&auto=format&fit=crop", caption: "Golden Hour", description: "Waktu cahaya memelukmu dan dunia rasanya berhenti.", createdAt: Date.now() - 1000*60*60*24*40 },
  { id: "p3", imageUrl: "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=1200&auto=format&fit=crop", caption: "Paris di hati kita", description: "Gerimis tipis, tawa kita keras.", createdAt: Date.now() - 1000*60*60*24*60 },
  { id: "p4", imageUrl: "https://images.unsplash.com/photo-1504196606672-aef5c9cefc88?q=80&w=1200&auto=format&fit=crop", caption: "Sarapan santai", description: "Minggu itu selalu milik kita.", createdAt: Date.now() - 1000*60*60*24*80 },
  { id: "p5", imageUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=1200&auto=format&fit=crop", caption: "Sunset di rumah", description: "Tempat favorit kita.", createdAt: Date.now() - 1000*60*60*24*120 },
  { id: "p6", imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=1200&auto=format&fit=crop", caption: "Taman rahasia", description: "Di sini aku bilang: tetap sama aku, selamanya.", createdAt: Date.now() - 1000*60*60*24*4 },
];

const seedSongs: Song[] = [
  { id: "s1", spotifyUrl: "https://open.spotify.com/track/0V3wPSX9ygBnCm8psDIegu", title: "Perfect - Ed Sheeran", note: "Lagu dansa kita", createdAt: Date.now()-20000 },
  { id: "s2", spotifyUrl: "https://open.spotify.com/track/1dGr1c8CrMLDpV6mPbImSI", title: "All of Me - John Legend", note: "Slow dance pertama", createdAt: Date.now()-15000 },
  { id: "s3", spotifyUrl: "https://open.spotify.com/track/7eJMfftS33KTjuF7lTsMCx", title: "Lover - Taylor Swift", note: "Minggu pagi bareng", createdAt: Date.now()-9000 },
];

const seedEvents: LoveEvent[] = [
  { id: "e1", date: "2022-02-14", title: "Awal dari segalanya", description: "Dua hati bilang iya. Andre & Lulu, selamanya.", icon: "💘", createdAt: 1 },
  { id: "e2", date: "2022-06-10", title: "Trip pertama", description: "Ketinggalan kereta, tapi nemuin kamu lagi. Lagi dan lagi.", icon: "🚞", createdAt: 2 },
  { id: "e3", date: "2023-11-02", title: "Rumah kita", description: "Kunci di tangan, kopi di kompor. Pulang.", icon: "🏡", createdAt: 3 },
  { id: "e4", date: "2024-09-18", title: "Sunset di Santorini", description: "Kamu bilang kamu mimpiin ini. Aku wujudkan.", icon: "🌅", createdAt: 4 },
];

const seedWords: LoveWord[] = [
  { id: "w1", quote: "Aku akan memilihmu di semua kehidupan, di semua semesta.", author: "Andre untuk Lulu", createdAt: 1 },
  { id: "w2", quote: "Cinta kita itu tenang. Itu rumah. Itu tawa di dapur.", author: "Lulu", createdAt: 2 },
  { id: "w3", quote: "Kalau harus diringkas, aku cuma mau bilang: mencintaimu itu mudah.", author: "Andre", createdAt: 3 },
];

const seedSettings: SiteSettings = {
  backgroundMusicUrl: "https://cdn.pixabay.com/audio/2022/10/30/audio_d1718ab41b.mp3",
  backgroundMusicTitle: "Love Piano – Lullaby for Lulu",
  heroTitle: "ANDRE & LULU ❤️",
  heroSubtitle: "Two Souls. One Heart. Forever.",
  anniversaryISO: "2022-02-14T00:00:00.000Z"
};

const mockStore: StoreTables = {
  photos: [...seedPhotos],
  songs: [...seedSongs],
  events: [...seedEvents],
  loveWords: [...seedWords],
  settings: { ...seedSettings },
};

type Listener<T> = (data: T) => void;
const bus = new EventTarget();

function mockNotify(name: keyof StoreTables) {
  bus.dispatchEvent(new CustomEvent("mock:" + name));
  broadcast(name);
}

// Listen cross-tab updates in demo mode
onBroadcast((table) => {
  bus.dispatchEvent(new CustomEvent("mock:" + table));
});

// --- Public API ---

function subscribePhotos(cb: Listener<Photo[]>): Unsubscribe {
  if (!firebaseEnabled || !db) {
    const fire = () => cb([...mockStore.photos].sort((a,b)=>b.createdAt-a.createdAt));
    const handler = () => fire();
    bus.addEventListener("mock:photos", handler);
    fire();
    return () => bus.removeEventListener("mock:photos", handler);
  }
  const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Photo,"id">) })));
  });
}

function subscribeSongs(cb: Listener<Song[]>): Unsubscribe {
  if (!firebaseEnabled || !db) {
    const fire = () => cb([...mockStore.songs].sort((a,b)=>b.createdAt-a.createdAt));
    const handler = ()=> fire();
    bus.addEventListener("mock:songs", handler);
    fire();
    return () => bus.removeEventListener("mock:songs", handler);
  }
  const q = query(collection(db, "songs"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Song,"id">) }))));
}

function subscribeEvents(cb: Listener<LoveEvent[]>): Unsubscribe {
  if (!firebaseEnabled || !db) {
    const fire = () => cb([...mockStore.events].sort((a,b)=> new Date(a.date).getTime() - new Date(b.date).getTime()));
    const handler = ()=> fire();
    bus.addEventListener("mock:events", handler);
    fire();
    return () => bus.removeEventListener("mock:events", handler);
  }
  const q = query(collection(db, "events"), orderBy("date", "asc"));
  return onSnapshot(q, snap => cb(snap.docs.map(d=> ({id: d.id, ...(d.data() as Omit<LoveEvent,"id">)} ))));
}

function subscribeLoveWords(cb: Listener<LoveWord[]>): Unsubscribe {
  if (!firebaseEnabled || !db) {
    const fire = () => cb([...mockStore.loveWords].sort((a,b)=>b.createdAt-a.createdAt));
    const handler = ()=> fire();
    bus.addEventListener("mock:loveWords", handler);
    fire();
    return () => bus.removeEventListener("mock:loveWords", handler);
  }
  const q = query(collection(db, "loveWords"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => cb(snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<LoveWord,"id">)}))));
}

function subscribeSettings(cb: Listener<SiteSettings>): Unsubscribe {
  if (!firebaseEnabled || !db) {
    const fire = () => cb({ ...mockStore.settings });
    const handler = ()=> fire();
    bus.addEventListener("mock:settings", handler);
    fire();
    return () => bus.removeEventListener("mock:settings", handler);
  }
  const refDoc = doc(db, "settings", "site");
  return onSnapshot(refDoc, snap => {
    if (snap.exists()) cb(snap.data() as SiteSettings);
    else cb(seedSettings);
  });
}

// CRUD
export async function addPhoto(input: Omit<Photo,"id"|"createdAt"> & { file?: File | null }) {
  if (!firebaseEnabled || !db) {
    const id = "p_" + Math.random().toString(36).slice(2,9);
    let imageUrl = input.imageUrl;
    if(input.file){
      imageUrl = await fileToDataUrl(input.file);
    }
    mockStore.photos.unshift({ id, imageUrl, caption: input.caption, description: input.description, createdAt: Date.now() });
    mockNotify("photos");
    return id;
  }
  let imageUrl = input.imageUrl;
  if (input.file && storage) {
    // Upload langsung tanpa kompresi untuk kecepatan maksimal
    const storageRef = ref(storage, `photos/${Date.now()}_${input.file.name}`);
    await uploadBytes(storageRef, input.file);
    imageUrl = await getDownloadURL(storageRef);
  }
  const docRef = await addDoc(collection(db, "photos"), {
    imageUrl, caption: input.caption, description: input.description || "",
    createdAt: Date.now()
  });
  return docRef.id;
}

export async function updatePhoto(id: string, data: Partial<Photo> & { file?: File | null }) {
  if (!firebaseEnabled || !db) {
    const i = mockStore.photos.findIndex(p => p.id === id);
    if (i >= 0) {
      let imageUrl = data.imageUrl ?? mockStore.photos[i].imageUrl;
      if (data.file) imageUrl = await fileToDataUrl(data.file);
      mockStore.photos[i] = { ...mockStore.photos[i], ...data, imageUrl, file: undefined } as Photo;
      mockNotify("photos");
    }
    return;
  }
  const updates: any = { ...data };
  delete updates.file;
  delete updates.id;
  if (data.file && storage) {
    const storageRef = ref(storage, `photos/${Date.now()}_${data.file.name}`);
    await uploadBytes(storageRef, data.file);
    updates.imageUrl = await getDownloadURL(storageRef);
  }
  await updateDoc(doc(db, "photos", id), updates);
}

export async function deletePhoto(id: string) {
  if (!firebaseEnabled || !db) {
    mockStore.photos = mockStore.photos.filter(p => p.id !== id);
    mockNotify("photos");
    return;
  }
  await deleteDoc(doc(db, "photos", id));
}

export async function addSong(input: Omit<Song,"id"|"createdAt">) {
  if (!firebaseEnabled || !db) {
    const id = "s_"+Math.random().toString(36).slice(2,8);
    mockStore.songs.unshift({ id, ...input, createdAt: Date.now()});
    mockNotify("songs"); return id;
  }
  const refd = await addDoc(collection(db, "songs"), { ...input, createdAt: Date.now() });
  return refd.id;
}
export async function updateSong(id:string, data: Partial<Song>) {
  if (!firebaseEnabled || !db) {
    const i = mockStore.songs.findIndex(s=>s.id===id);
    if(i>=0){ mockStore.songs[i] = { ...mockStore.songs[i], ...data }; mockNotify("songs"); }
    return;
  }
  await updateDoc(doc(db,"songs",id), data);
}
export async function deleteSong(id:string) {
  if (!firebaseEnabled || !db) { mockStore.songs = mockStore.songs.filter(s=>s.id!==id); mockNotify("songs"); return; }
  await deleteDoc(doc(db,"songs",id));
}

export async function addEvent(input: Omit<LoveEvent,"id"|"createdAt">) {
  if (!firebaseEnabled || !db) { const id="e_"+Math.random().toString(36).slice(2,8); mockStore.events.push({id, ...input, createdAt: Date.now()}); mockNotify("events"); return id; }
  const r = await addDoc(collection(db,"events"),{...input, createdAt: Date.now()}); return r.id;
}
export async function updateEvent(id:string, data: Partial<LoveEvent>) {
  if (!firebaseEnabled || !db) { const i=mockStore.events.findIndex(e=>e.id===id); if(i>=0){mockStore.events[i] = {...mockStore.events[i],...data}; mockNotify("events");} return;}
  await updateDoc(doc(db,"events",id), data);
}
export async function deleteEvent(id:string){
  if (!firebaseEnabled || !db) { mockStore.events = mockStore.events.filter(e=>e.id!==id); mockNotify("events"); return;}
  await deleteDoc(doc(db,"events",id));
}

export async function addLoveWord(input: Omit<LoveWord,"id"|"createdAt">) {
  if (!firebaseEnabled || !db) { const id="w_"+Math.random().toString(36).slice(2,8); mockStore.loveWords.unshift({id, ...input, createdAt: Date.now()}); mockNotify("loveWords"); return id; }
  const r = await addDoc(collection(db,"loveWords"),{...input, createdAt: Date.now()}); return r.id;
}
export async function updateLoveWord(id:string, data: Partial<LoveWord>) {
  if (!firebaseEnabled || !db) { const i=mockStore.loveWords.findIndex(w=>w.id===id); if(i>=0){mockStore.loveWords[i]={...mockStore.loveWords[i],...data}; mockNotify("loveWords");} return;}
  await updateDoc(doc(db,"loveWords",id), data);
}
export async function deleteLoveWord(id:string){
  if (!firebaseEnabled || !db) { mockStore.loveWords = mockStore.loveWords.filter(w=>w.id!==id); mockNotify("loveWords"); return;}
  await deleteDoc(doc(db,"loveWords",id));
}

export async function saveSettings(settings: SiteSettings) {
  if (!firebaseEnabled || !db) { mockStore.settings = { ...settings }; mockNotify("settings"); return; }
  await setDoc(doc(db,"settings","site"), settings, { merge: true });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export {
  subscribePhotos,
  subscribeSongs,
  subscribeEvents,
  subscribeLoveWords,
  subscribeSettings,
};

// Seed Firestore once if it's empty and real
export async function ensureSeed() {
  if (!firebaseEnabled || !db) return;
  const siteDoc = await getDoc(doc(db, "settings", "site"));
  if (!siteDoc.exists()) {
    await setDoc(doc(db, "settings", "site"), seedSettings);
  }
}
