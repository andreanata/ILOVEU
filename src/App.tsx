import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  subscribePhotos, subscribeSongs, subscribeEvents, subscribeLoveWords, subscribeSettings,
  addPhoto, updatePhoto, deletePhoto,
  addSong, updateSong, deleteSong,
  addEvent, updateEvent, deleteEvent,
  addLoveWord, updateLoveWord, deleteLoveWord,
  saveSettings,
  type Photo, type Song, type LoveEvent, type LoveWord, type SiteSettings,
  ensureSeed,
} from "./lib/db";
import { firebaseEnabled } from "./lib/firebase";

// Helpers
const ADMIN_PASSWORD = "AndreLulu#2022*";

// Spotify helpers
function spotifyEmbedUrl(url: string) {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("spotify.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      const type = parts[0];
      const id = parts[1].split("?")[0];
      if (["track", "album", "playlist"].includes(type)) {
        return `https://open.spotify.com/embed/${type}/${id}`;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export default function App() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [events, setEvents] = useState<LoveEvent[]>([]);
  const [loveWords, setLoveWords] = useState<LoveWord[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [quoteIdx, setQuoteIdx] = useState(0);

  useEffect(() => { ensureSeed(); }, []);

  useEffect(() => {
    if (firebaseEnabled) {
      console.log("[Andre & Lulu] Firebase Live Sync aktif ❤️");
    } else {
      console.log("[Andre & Lulu] Demo Mode — tambahkan Firebase config untuk sinkron lintas device");
    }
  }, []);

  // Realtime subscriptions
  useEffect(() => {
    const unsubs = [
      subscribePhotos(setPhotos),
      subscribeSongs(setSongs),
      subscribeEvents(setEvents),
      subscribeLoveWords(setLoveWords),
      subscribeSettings(setSettings),
    ];
    return () => unsubs.forEach(u => u && u());
  }, []);

  // Quote rotate
  useEffect(() => {
    if (!loveWords.length) return;
    const id = setInterval(() => setQuoteIdx(i => (i + 1) % loveWords.length), 5200);
    return () => clearInterval(id);
  }, [loveWords.length]);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#fff7f9]">
      <BackgroundRomance />
      <Toaster richColors position="top-center" />

      <Header onOpenLogin={() => setShowLogin(true)} isAdmin={isAdmin} onOpenAdmin={() => setShowAdmin(true)} />

      <main className="relative z-10">
        <Hero settings={settings} onLoveClick={() => setShowLogin(true)} />
        <LoveCounter anniversaryISO={settings?.anniversaryISO ?? "2022-02-14T00:00:00.000Z"} />
        <section id="gallery" className="max-w-6xl mx-auto px-5 sm:px-7 lg:px-8 py-16 sm:py-22">
          <SectionHeading eyebrow="Kenangan" title="Galeri kami" subtitle="Setiap foto adalah napas cinta yang kami simpan bersama." />
          <PhotoMasonry photos={photos} onOpen={setLightboxPhoto} isAdmin={isAdmin} />
        </section>

        <section id="music" className="bg-gradient-to-b from-[#fff3f6] to-white border-y border-[#f7d7e1]">
          <div className="max-w-6xl mx-auto px-5 sm:px-7 lg:px-8 py-16 sm:py-24">
            <SectionHeading eyebrow="Soundtrack cinta" title="Lagu-lagu kami" subtitle="Tekan play dan ingat kita berdua." />
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              {songs.map(s => {
                const embed = spotifyEmbedUrl(s.spotifyUrl);
                return (
                  <div key={s.id} className="glass rounded-[22px] p-3 sm:p-4 soft-shadow-sm">
                    {embed ? (
                      <iframe
                        className="spotify-iframe"
                        src={embed}
                        height={152}
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      />
                    ) : (
                      <div className="px-3 py-3 text-rose-800 text-sm">Link Spotify tidak valid.</div>
                    )}
                    {s.note && <p className="font-serif text-[17px] text-[#6e3b47] px-2 pt-3 pb-1">“{s.note}”</p>}
                  </div>
                );
              })}
              {songs.length === 0 && (
                <div className="text-[#a06371]">Belum ada lagu. Tambahkan dari Dashboard ya.</div>
              )}
            </div>
          </div>
        </section>

        <section id="timeline" className="max-w-5xl mx-auto px-5 sm:px-7 lg:px-8 py-20 sm:py-28">
          <SectionHeading eyebrow="Kisah kita" title="Linimasa cinta" subtitle="Dari pertama kali bilang 'iya', sampai selamanya." />
          <Timeline events={events} />
        </section>

        <section id="words" className="relative">
          <div className="max-w-4xl mx-auto px-5 sm:px-7 lg:px-8 py-20">
            <div className="glass-rose rounded-[28px] p-8 sm:p-12 text-center soft-shadow">
              <div className="text-[11px] tracking-widest text-[#b75a72] uppercase">Kata-Kata Cinta</div>
              <AnimatePresence mode="wait">
                <motion.blockquote
                  key={loveWords[quoteIdx]?.id || "empty"}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: .45 }}
                  className="font-display text-[28px] sm:text-[40px] leading-snug text-[#3c2027] mt-5"
                >
                  “{loveWords[quoteIdx]?.quote || "Aku mencintaimu di setiap pagiku."}”
                </motion.blockquote>
              </AnimatePresence>
              <div className="mt-4 text-[#a45d6f] font-serif text-lg">
                {loveWords[quoteIdx]?.author || "Andre ❤︎ Lulu"}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 sm:px-7 lg:px-8 pb-24">
          <div className="glass rounded-[26px] px-6 sm:px-10 py-9 flex flex-col md:flex-row items-center justify-between gap-5">
            <div>
              <div className="font-display text-[26px] sm:text-[34px] text-[#352027]">Bagikan cinta kami</div>
              <div className="text-[#a05a6b]">Kirim ke orang-orang yang sayang sama kita.</div>
            </div>
            <ShareRow />
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#f1ced8] bg-white/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-7 lg:px-8 py-10 text-sm flex flex-col sm:flex-row justify-between gap-3 text-[#9b5a69]">
          <div>© {new Date().getFullYear()} ANDRE & LULU ❤️ — Two Souls. One Heart. Forever.</div>
          <div className="flex items-center gap-4 flex-wrap">
            <a href="#gallery" className="link-underline">Galeri</a>
            <a href="#music" className="link-underline">Lagu</a>
            <a href="#timeline" className="link-underline">Cerita</a>
            <button onClick={()=>setShowLogin(true)} className="link-underline inline-flex items-center gap-1" aria-label="Login"><span>💗</span></button>
          </div>
        </div>
      </footer>

      {/* Floating Love Music Player */}
      {settings && <LoveMusicPlayer title={settings.backgroundMusicTitle} src={settings.backgroundMusicUrl} />}

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxPhoto && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
            onClick={()=>setLightboxPhoto(null)}
          >
            <motion.img
              initial={{ scale: .96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: .96, opacity: 0 }}
              src={lightboxPhoto.imageUrl}
              alt={lightboxPhoto.caption}
              className="max-h-[86vh] max-w-[95vw] rounded-[18px] shadow-2xl"
              onClick={e=>e.stopPropagation()}
            />
            <div className="absolute bottom-7 left-1/2 -translate-x-1/2 text-white text-center max-w-xl px-4">
              <div className="font-display text-[22px]">{lightboxPhoto.caption}</div>
              {lightboxPhoto.description && <div className="text-white/80 text-sm mt-1">{lightboxPhoto.description}</div>}
            </div>
            <button className="absolute top-5 right-5 text-white/95 text-[15px] bg-white/10 hover:bg-white/20 rounded-full px-3 py-1.5" onClick={()=>setLightboxPhoto(null)}>Tutup ✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Love Login Modal */}
      <LoginModal
        open={showLogin}
        onClose={()=>setShowLogin(false)}
        onSuccess={() => { setIsAdmin(true); setShowLogin(false); setShowAdmin(true); toast.success("Selamat datang, cinta ❤️"); }}
      />

      {/* Admin Dashboard */}
      <AdminDrawer
        open={showAdmin && isAdmin}
        onClose={()=>setShowAdmin(false)}
        setIsAdmin={setIsAdmin}
        photos={photos}
        songs={songs}
        events={events}
        loveWords={loveWords}
        settings={settings}
      />

      {/* Floating heart login button — hanya tombol Love */}
      {!showLogin && !showAdmin && (
        <motion.button
          onClick={()=>setShowLogin(true)}
          aria-label="Masuk"
          className="fixed bottom-5 left-5 z-[59] w-14 h-14 rounded-full glass-rose soft-shadow-sm flex items-center justify-center text-[26px] hover:scale-105 transition champagne-glow"
          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          title="Masuk"
        >
          <HeartPulse />
        </motion.button>
      )}
    </div>
  );
}

function Header({ onOpenLogin, isAdmin, onOpenAdmin }: { onOpenLogin: ()=>void; isAdmin: boolean; onOpenAdmin: ()=>void }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#fff7f8]/80 border-b border-[#f4d2dc]">
      <div className="max-w-6xl mx-auto px-5 sm:px-7 lg:px-8 h-[68px] flex items-center justify-between">
        <a href="#" className="font-display font-[650] text-[20px] sm:text-[22px] text-[#3b2329] tracking-[.01em]">
          ❤️ANDRE & LULU ❤️
        </a>
        <nav className="hidden sm:flex items-center gap-7 text-[13.5px] text-[#90515f] font-medium">
          <a href="#gallery" className="hover:text-[#c83b64] transition">Galeri</a>
          <a href="#music" className="hover:text-[#c83b64] transition">Lagu</a>
          <a href="#timeline" className="hover:text-[#c83b64] transition">Cerita</a>
          <a href="#words" className="hover:text-[#c83b64] transition">Kata Cinta</a>
        </nav>
        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button onClick={onOpenAdmin} className="al-btn al-btn-soft text-sm !py-[9px]">Dashboard</button>
          ) : (
            <button
              onClick={onOpenLogin}
              aria-label="Masuk"
              className="w-10 h-10 rounded-full bg-white border border-[#f2c7d4] text-[#d53965] flex items-center justify-center hover:bg-[#fff0f4] transition text-[18px]"
              title="Masuk"
            >
              💗
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ settings, onLoveClick }: { settings: SiteSettings | null; onLoveClick: ()=>void }) {
  const name = (settings?.heroTitle || "ANDRE & LULU").replace(/❤️|❤/g, '').trim()
  return (
    <section className="relative">
      <div className="max-w-6xl mx-auto px-5 sm:px-7 lg:px-8 pt-16 sm:pt-24 pb-14 sm:pb-20">
        <div className="grid lg:grid-cols-[1.08fr_.92fr] gap-10 items-center">
          <div>
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}>
              <div className="inline-flex items-center gap-2 text-[11px] tracking-[.14em] text-[#b45a70] uppercase font-medium bg-white/75 border border-[#f4ced8] px-3 py-1.5 rounded-full">
                Dua hati, satu cerita
              </div>

              <div className="mt-7">
                <h1 className="font-display text-[44px] sm:text-[60px] lg:text-[68px] leading-[1.02] tracking-[-0.011em] text-[#2b1d21]">
                  {name}
                </h1>
                <div className="flex items-center gap-3 mt-2 text-[#e06b87]">
                  <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#e8a8b9]"></span>
                  <span className="text-[22px]">❤︎</span>
                  <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#e8a8b9]"></span>
                </div>
              </div>

              <p className="font-serif text-[20px] sm:text-[22px] text-[#7f4757] mt-5 max-w-[520px] leading-relaxed">
                Dua jiwa. Satu hati. Selamanya.
              </p>
              <p className="font-serif italic text-[17.5px] text-[#aa6574] mt-2 max-w-[510px]">
                “Bersamamu, setiap hari terasa seperti pulang. Untuk Lulu, cinta seumur hidupku — Andre”
              </p>

              <div className="flex gap-3 mt-8">
                <a href="#gallery" className="al-btn al-btn-primary">Lihat galeri</a>
                <a href="#timeline" className="al-btn al-btn-soft">Kisah kami</a>
              </div>
            </motion.div>
          </div>

          {/* Collage */}
          <motion.div
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6, delay: .1 }}
            className="relative"
          >
            <div className="glass rounded-[28px] p-5 sm:p-7 soft-shadow">
              <div className="grid grid-cols-3 gap-3">
                {[
                  "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=900&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=900&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1504196606672-aef5c9cefc88?q=80&w=900&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1529636798458-92182e662485?q=80&w=900&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=900&auto=format&fit=crop",
                  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=900&auto=format&fit=crop",
                ].map((src, i) => (
                  <div key={i} className={`rounded-[16px] overflow-hidden bg-[#f9dde4] ${i===0?'col-span-2 aspect-[16/10]': i===1?'aspect-square':'aspect-[4/3]'}`}>
                    <img src={src} className="w-full h-full object-cover" alt="" />
                  </div>
                ))}
              </div>
              <div className="text-center text-[12px] text-[#a65a6b] mt-3">Selamanya, Lulu. — Andre</div>
            </div>

            {/* Tombol Love aja */}
            <button
              onClick={onLoveClick}
              aria-label="Masuk"
              className="absolute -bottom-5 -right-3 sm:-right-5 w-14 h-14 rounded-full glass-rose champagne-glow text-[26px] flex items-center justify-center hover:scale-[1.06] transition"
              title="Masuk"
            >
              <HeartPulse />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LoveCounter({ anniversaryISO }: { anniversaryISO: string }) {
  const [now, setNow] = useState(()=>Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const start = useMemo(()=> new Date(anniversaryISO).getTime(), [anniversaryISO]);
  const diff = Math.max(0, now - start);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  const Item = ({ v, label }: { v: number; label: string }) => (
    <div className="glass-rose rounded-[20px] px-6 py-5 min-w-[108px] text-center">
      <div className="font-display text-[36px] tracking-tight text-[#2f2024]">{String(v).padStart(2,'0')}</div>
      <div className="text-[11px] uppercase tracking-widest text-[#b75b70] mt-1">{label}</div>
    </div>
  );

  return (
    <section className="py-12 sm:py-16 border-y border-[#f3cad6] bg-[#fff1f4]/80">
      <div className="max-w-6xl mx-auto px-5 sm:px-7 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] uppercase tracking-[.18em] text-[#c05670]">Sejak 14 Februari 2022</div>
            <div className="font-display text-[33px] sm:text-[42px] text-[#2b1d21]">Penghitung cinta kami</div>
          </div>
          <div className="text-[#955f6d] font-serif text-[18px]">Dua hati, satu waktu.</div>
        </div>
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-6">
          <Item v={days} label="Hari" />
          <Item v={hours} label="Jam" />
          <Item v={mins} label="Menit" />
          <Item v={secs} label="Detik" />
        </div>
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
      <div className="text-[11px] tracking-[.18em] uppercase text-[#c75b74]">{eyebrow}</div>
      <h2 className="font-display text-[40px] sm:text-[54px] tracking-[-0.012em] text-[#2a1d21]">{title}</h2>
      <p className="text-[#90606c] font-serif text-[18px] mt-2">{subtitle}</p>
    </div>
  );
}

function PhotoMasonry({ photos, onOpen, isAdmin }: { photos: Photo[]; onOpen: (p: Photo)=>void; isAdmin: boolean }) {
  return (
    <div className="masonry">
      {photos.map(p => (
        <div key={p.id} className="masonry-item glass rounded-[20px] overflow-hidden soft-shadow-sm group">
          <button onClick={()=>onOpen(p)} className="block w-full text-left">
            <div className="relative">
              <img src={p.imageUrl} alt={p.caption} className="w-full h-auto block transition duration-300 group-hover:scale-[1.015]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-black/0 to-transparent opacity-90" />
            </div>
          </button>
          <div className="px-4 py-3">
            <div className="font-display text-[21px] text-[#322127]">{p.caption}</div>
            {p.description && <div className="text-sm text-[#8a5461] mt-1">{p.description}</div>}
            {isAdmin && <div className="text-[11px] text-[#b56d7c] mt-1">ID: {p.id} • realtime sync</div>}
          </div>
        </div>
      ))}
      {photos.length === 0 && <div className="text-[#9d5d6c]">Belum ada foto.</div>}
    </div>
  );
}

function Timeline({ events }: { events: LoveEvent[] }) {
  return (
    <div className="relative">
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-[#f2bfd0] via-[#f1b7c8] to-[#f2bfd0]" />
      <div className="space-y-12">
        {events.map((ev, i) => (
          <div key={ev.id} className={`relative grid md:grid-cols-2 gap-8 items-center ${i%2===0 ? '' : 'md:[&>div:first-child]:order-2'}`}>
            <div className={i%2===0 ? "md:text-right" : ""}>
              <div className="font-display text-[28px] text-[#2d2024]">{ev.title}</div>
              <div className="text-[#a55c6b] text-sm mt-1">{new Date(ev.date).toLocaleDateString('id-ID', { day: '2-digit', month:'long', year: 'numeric'})}</div>
              <div className="text-[#79515a] mt-2">{ev.description}</div>
            </div>
            <div className="relative">
              <div className="absolute left-0 md:left-[-14px] top-4 w-[14px] h-[14px] rounded-full bg-white border-[3px] border-[#e86d8d] shadow" style={{ left: i%2===0 ? "-20px" : undefined }} />
              <div className="glass-rose rounded-[18px] px-5 py-4 inline-flex">
                <span className="text-2xl">{ev.icon || "💞"}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ShareRow() {
  const shareUrl = typeof window !== "undefined" ? window.location.href : "https://andre-lulu.love";
  const text = encodeURIComponent("ANDRE & LULU ❤️ — Two Souls. One Heart. Forever.");
  const url = encodeURIComponent(shareUrl);
  return (
    <div className="flex flex-wrap gap-2">
      <a target="_blank" rel="noreferrer" href={`https://wa.me/?text=${text}%20${url}`} className="al-btn al-btn-soft">WhatsApp</a>
      <a target="_blank" rel="noreferrer" href={`https://t.me/share/url?url=${url}&text=${text}`} className="al-btn al-btn-soft">Telegram</a>
      <a target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${url}`} className="al-btn al-btn-soft">Facebook</a>
      <button
        onClick={async ()=>{
          try { await navigator.clipboard.writeText(shareUrl); toast.success("Link tersalin!"); }
          catch { toast("Salin: " + shareUrl); }
        }}
        className="al-btn al-btn-primary"
      >
        Salin Link
      </button>
    </div>
  );
}

/* ---------- LOVE MUSIC floating player (compact button) ---------- */
function LoveMusicPlayer({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  // Try autoplay when component mounts / src changes
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = true;
    a.volume = 0.6;
    let cancelled = false;

    const tryPlay = async () => {
      try {
        await a.play();
        if (!cancelled) setPlaying(true);
      } catch {
        if (!cancelled) setPlaying(false);
      }
    };
    tryPlay();

    const resumeOnInteract = () => {
      if (audioRef.current && audioRef.current.paused) {
        audioRef.current.play().then(() => setPlaying(true)).catch(()=>{});
      }
    };
    window.addEventListener("click", resumeOnInteract, { once: true });
    window.addEventListener("touchstart", resumeOnInteract, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("click", resumeOnInteract);
      window.removeEventListener("touchstart", resumeOnInteract);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const toggle = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      try {
        await a.play();
        setPlaying(true);
      } catch {
        toast("Ketuk untuk memutar musik cinta ❤️");
      }
    }
  };

  return (
    <div className="fixed right-4 bottom-4 z-[60]">
      <audio ref={audioRef} src={src} loop preload="auto" playsInline />
      <button
        onClick={toggle}
        className={`al-btn soft-shadow flex items-center gap-2 rounded-full px-5 py-3 font-semibold text-sm transition-all hover:scale-[1.02] ${
          playing 
            ? "bg-gradient-to-r from-[#ff6f96] to-[#e74975] text-white" 
            : "glass text-[#c23d63]"
        }`}
        title={title}
      >
        <span className="text-[18px]">{playing ? "🔊" : "🔈"}</span>
        <span>Love Music</span>
        {playing && (
          <span className="ml-1 flex gap-0.5 items-end h-3">
            <motion.span animate={{ height: [4, 12, 6, 14, 4] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-0.5 bg-white/80 rounded-full" />
            <motion.span animate={{ height: [6, 10, 14, 8, 6] }} transition={{ repeat: Infinity, duration: 0.9 }} className="w-0.5 bg-white/80 rounded-full" />
            <motion.span animate={{ height: [8, 6, 10, 4, 8] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-0.5 bg-white/80 rounded-full" />
          </span>
        )}
      </button>
    </div>
  );
}

/* ---------- LOGIN ---------- */
function LoginModal({ open, onClose, onSuccess } : { open: boolean; onClose: ()=>void; onSuccess: ()=>void }) {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(()=>{
    if(open) setPw("");
  },[open]);

  if(!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] flex items-center justify-center p-4">
      <motion.div
        initial={{ y: 16, opacity: 0, scale: .985 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        className="glass rounded-[26px] w-full max-w-md soft-shadow overflow-hidden"
      >
        <div className="px-7 pt-7 pb-6">
          <div className="flex items-center justify-between">
            <div className="font-display text-[28px] text-[#2e1e22] flex items-center gap-2">Masuk <span>💗</span></div>
            <button onClick={onClose} className="text-[#a75b6d]">✕</button>
          </div>
          <div className="text-[#9b5667] text-sm mt-1">Akses eksklusif Andre & Lulu.</div>

          <div className="mt-5">
            <label className="al-label">Kata Sandi</label>
            <input
              type="password"
              value={pw}
              onChange={e=>setPw(e.target.value)}
              placeholder="••••••••"
              className="al-input"
              autoFocus
              onKeyDown={e=>{
                if(e.key==="Enter") tryLogin();
              }}
            />
            <div className="text-[11.5px] text-[#b16a79] mt-2">Petunjuk: AndreLulu#2022*</div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              disabled={busy}
              onClick={tryLogin}
              className="al-btn al-btn-primary flex-1"
            >Masuk</button>
            <button onClick={onClose} className="al-btn al-btn-ghost">Batal</button>
          </div>

          <div className="text-[11.5px] text-[#b06a7a] mt-4">
            Login hanya dengan kata sandi (tanpa username). Firebase Auth siap dipakai.
          </div>
        </div>
      </motion.div>
    </div>
  );

  function tryLogin() {
    setBusy(true);
    setTimeout(()=>{
      if (pw === ADMIN_PASSWORD) onSuccess();
      else toast.error("Kata sandi salah");
      setBusy(false);
    }, 220);
  }
}

/* ---------- ADMIN DASHBOARD ---------- */
function AdminDrawer({ open, onClose, setIsAdmin, photos, songs, events, loveWords, settings }:
  { open: boolean; onClose: ()=>void; setIsAdmin: (v: boolean)=>void; photos: Photo[]; songs: Song[]; events: LoveEvent[]; loveWords: LoveWord[]; settings: SiteSettings | null }) {

  const [tab, setTab] = useState<"photos"|"songs"|"events"|"words"|"site">("photos");

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-[85]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="fixed right-0 top-0 h-full w-full sm:w-[980px] max-w-[100vw] z-[86] bg-[#fff9fa] border-l border-[#f0cad4] shadow-2xl flex flex-col"
          >
            <div className="px-5 sm:px-8 h-[68px] flex items-center justify-between border-b border-[#f1cbd5] bg-white/70 backdrop-blur">
              <div className="font-display text-[26px]">Admin Dashboard <span className="text-[#e75d80]">❤️</span></div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setIsAdmin(false); onClose(); }}
                  className="al-btn al-btn-soft !py-[8px]"
                >
                  Logout
                </button>
                <button onClick={onClose} className="al-btn al-btn-primary !py-[8px]">Tutup</button>
              </div>
            </div>

            <div className="px-5 sm:px-8 pt-4 flex gap-2 flex-wrap border-b border-[#f3cfd7] bg-[#fff4f6]">
              {[
                ["photos", "Foto"],
                ["songs", "Spotify"],
                ["events", "Timeline"],
                ["words", "Kata Cinta"],
                ["site", "Situs / Musik"]
              ].map(([k, label]) => (
                <button key={k}
                  onClick={()=>setTab(k as any)}
                  className={`px-4 py-2.5 rounded-t-xl text-[13.5px] font-semibold transition ${tab===k ? "bg-white border border-b-0 border-[#ecc1cd] text-[#c03d60]" : "text-[#9b5465] hover:bg-white/70"}`}
                >{label}</button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
              {tab === "photos" && <PhotosAdmin photos={photos} />}
              {tab === "songs" && <SongsAdmin songs={songs} />}
              {tab === "events" && <EventsAdmin events={events} />}
              {tab === "words" && <WordsAdmin loveWords={loveWords} />}
              {tab === "site" && settings && <SiteAdmin settings={settings} />}
            </div>
            <div className="px-5 sm:px-8 py-3 border-t border-[#f0c9d3] bg-white text-[12px] text-[#ad5f6e]">
              Semua perubahan disimpan ke Firestore dan langsung tersebar via <code>onSnapshot()</code> ke semua perangkat.
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function PhotosAdmin({ photos }: { photos: Photo[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [editing, setEditing] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);

  const reset = () => { setFile(null); setCaption(""); setDescription(""); setImageUrl(""); setEditing(null); setUploading(false); };

  async function submit() {
    if (!caption) return toast.error("Tambahkan judul foto");
    if (!editing && !file && !imageUrl) return toast.error("Upload gambar atau tempel URL");

    setUploading(true);
    try {
      if (editing) {
        await updatePhoto(editing.id, { caption, description, imageUrl: imageUrl || editing.imageUrl, file });
        toast.success("Foto diupdate, langsung sinkron");
      } else {
        await addPhoto({ caption, description, imageUrl: imageUrl || "", file });
        toast.success("Foto diposting – realtime!");
      }
      reset();
    } catch(e:any){ 
      toast.error(e.message || "Error");
    } finally {
      setUploading(false);
    }
  }

  const photoCount = photos.length;

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-7">
      <div className="glass rounded-[20px] p-5">
        <div className="font-display text-[22px] mb-3">{editing ? "Edit foto" : "Foto baru"}</div>

        {/* Info penyimpanan */}
        <div className={`rounded-xl px-3 py-2 mb-4 text-[12px] ${firebaseEnabled ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
          <div className="font-semibold">{firebaseEnabled ? '✅ Firebase Aktif' : '⚠️ Demo Mode'}</div>
          <div>{firebaseEnabled ? 'Firebase Storage • Free 5GB' : 'Foto hilang saat refresh'}</div>
          <div className="mt-1 font-medium">{photoCount} foto tersimpan</div>
        </div>

        <label className="al-label">Judul / Caption</label>
        <input className="al-input mb-3" value={caption} onChange={e=>setCaption(e.target.value)} placeholder="Contoh: Senja di rumah" />
        <label className="al-label">Deskripsi</label>
        <textarea className="al-input mb-3" rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Ceritain sedikit…" />
        <label className="al-label">Upload (Firebase Storage)</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={e=>{
            const f = e.target.files?.[0] || null;
            setFile(f);
          }} 
          className="al-input mb-2" 
          disabled={uploading}
        />
        <div className="text-[11.5px] text-[#a85f6f] mb-2">atau tempel URL gambar:</div>
        <input className="al-input mb-3" value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://…" disabled={uploading} />
        <div className="flex gap-2">
          <button disabled={uploading} onClick={submit} className="al-btn al-btn-primary">
            {uploading ? "Mengupload..." : editing ? "Simpan" : "Posting"}
          </button>
          {editing && <button onClick={reset} className="al-btn al-btn-ghost" disabled={uploading}>Batal</button>}
        </div>
        <p className="text-[11.5px] text-[#b06a7b] mt-3">
          Gambar disimpan di Firebase Storage /photos. Metadata di Firestore.
        </p>
      </div>

      <div>
        <div className="text-[12px] text-[#a45b6b] mb-2">Galeri ({photos.length})</div>
        <div className="grid sm:grid-cols-2 gap-4">
          {photos.map(p=>(
            <div key={p.id} className="bg-white rounded-[16px] border border-[#f1cdd7] p-3 flex gap-3">
              <img src={p.imageUrl} className="w-24 h-24 object-cover rounded-xl" alt={p.caption} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[#2f2124] truncate">{p.caption}</div>
                <div className="text-xs text-[#9a5b68] line-clamp-2">{p.description}</div>
                <div className="flex gap-2 mt-2">
                  <button className="text-[12px] text-[#c03b60] font-semibold" onClick={()=>{
                    setEditing(p); setCaption(p.caption); setDescription(p.description||""); setImageUrl(p.imageUrl);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}>Edit</button>
                  <button className="text-[12px] text-[#8d5462]" onClick={async()=>{
                    if (confirm("Hapus foto ini?")) { 
                      await deletePhoto(p.id); 
                      toast.success("Foto dihapus"); 
                    }
                  }}>Hapus</button>
                </div>
              </div>
            </div>
          ))}
          {photos.length === 0 && <div className="text-[#9d5d6c] col-span-2">Belum ada foto.</div>}
        </div>
      </div>
    </div>
  );
}

function SongsAdmin({ songs }: { songs: Song[] }) {
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState<Song | null>(null);

  const reset = () => { setSpotifyUrl(""); setTitle(""); setNote(""); setEditing(null); };

  async function submit() {
    if (!spotifyUrl) return toast.error("Tempel URL Spotify");
    const embed = spotifyEmbedUrl(spotifyUrl);
    if (!embed) return toast.error("Link Spotify tidak valid");
    try {
      if (editing) {
        await updateSong(editing.id, { spotifyUrl, title, note });
        toast.success("Lagu diupdate, sync live");
      } else {
        await addSong({ spotifyUrl, title, note });
        toast.success("Lagu ditambahkan");
      }
      reset();
    } catch(e:any){ toast.error(e.message); }
  }

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-7">
      <div className="glass rounded-[20px] p-5">
        <div className="font-display text-[22px] mb-3">{editing ? "Edit lagu" : "Tambah Spotify"}</div>
        <label className="al-label">Spotify URL (track / album / playlist)</label>
        <input className="al-input mb-3" value={spotifyUrl} onChange={e=>setSpotifyUrl(e.target.value)} placeholder="https://open.spotify.com/track/..." />
        <label className="al-label">Judul (opsional)</label>
        <input className="al-input mb-3" value={title} onChange={e=>setTitle(e.target.value)} />
        <label className="al-label">Catatan romantis</label>
        <input className="al-input mb-3" value={note} onChange={e=>setNote(e.target.value)} placeholder="Lagu dansa kita…" />
        <div className="flex gap-2">
          <button className="al-btn al-btn-primary" onClick={submit}>{editing ? "Simpan" : "Tambah"}</button>
          {editing && <button className="al-btn al-btn-ghost" onClick={reset}>Batal</button>}
        </div>
        <p className="text-[11.5px] text-[#ab6272] mt-3">URL otomatis dikonversi ke embed Spotify.</p>
      </div>
      <div className="space-y-3">
        {songs.map(s=>(
          <div key={s.id} className="bg-white rounded-[16px] border border-[#f1cdd7] px-4 py-3 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-sm text-[#a45a6a] truncate">{s.spotifyUrl}</div>
              <div className="text-[13.5px] text-[#4c2b32]">{s.title || "—"} {s.note ? <span className="text-[#a75d6d]">• {s.note}</span> : null}</div>
            </div>
            <div className="flex gap-3 text-[12.5px]">
              <button className="text-[#c03b60] font-semibold" onClick={()=>{ setEditing(s); setSpotifyUrl(s.spotifyUrl); setTitle(s.title||""); setNote(s.note||""); }}>Edit</button>
              <button className="text-[#886067]" onClick={async()=>{ if(confirm("Hapus?")) { await deleteSong(s.id); toast("Dihapus"); }}}>Hapus</button>
            </div>
          </div>
        ))}
        {songs.length===0 && <div className="text-[#a45c6d]">Belum ada lagu.</div>}
      </div>
    </div>
  );
}

function EventsAdmin({ events }: { events: LoveEvent[] }) {
  const [date, setDate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("💞");
  const [editing, setEditing] = useState<LoveEvent | null>(null);

  const reset = ()=>{ setDate(""); setTitle(""); setDescription(""); setIcon("💞"); setEditing(null); };

  async function submit(){
    if(!date || !title) return toast.error("Isi tanggal dan judul");
    try {
      if (editing) { await updateEvent(editing.id, { date, title, description, icon }); toast.success("Event diupdate"); }
      else { await addEvent({ date, title, description, icon }); toast.success("Event ditambahkan"); }
      reset();
    } catch(e:any){ toast.error(e.message); }
  }

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-7">
      <div className="glass rounded-[20px] p-5">
        <div className="font-display text-[22px] mb-3">{editing ? "Edit event" : "Event baru"}</div>
        <label className="al-label">Tanggal</label>
        <input type="date" className="al-input mb-3" value={date} onChange={e=>setDate(e.target.value)} />
        <label className="al-label">Judul</label>
        <input className="al-input mb-3" value={title} onChange={e=>setTitle(e.target.value)} />
        <label className="al-label">Deskripsi</label>
        <textarea className="al-input mb-3" rows={3} value={description} onChange={e=>setDescription(e.target.value)} />
        <label className="al-label">Ikon</label>
        <input className="al-input mb-3" value={icon} onChange={e=>setIcon(e.target.value)} placeholder="💘" />
        <div className="flex gap-2">
          <button className="al-btn al-btn-primary" onClick={submit}>{editing ? "Simpan" : "Tambah"}</button>
          {editing && <button className="al-btn al-btn-ghost" onClick={reset}>Batal</button>}
        </div>
      </div>
      <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
        {events.map(ev=>(
          <div key={ev.id} className="bg-white border border-[#f0cdd6] rounded-[14px] px-4 py-3 flex items-center justify-between">
            <div>
              <div className="font-medium">{ev.icon} {ev.title}</div>
              <div className="text-sm text-[#9b5a68]">{ev.date} — {ev.description}</div>
            </div>
            <div className="flex gap-3 text-[12.5px]">
              <button className="text-[#c03b60] font-semibold" onClick={()=>{ setEditing(ev); setDate(ev.date); setTitle(ev.title); setDescription(ev.description); setIcon(ev.icon||"💞"); }}>Edit</button>
              <button className="text-[#886067]" onClick={async()=>{ if(confirm("Hapus event?")) { await deleteEvent(ev.id); toast("Dihapus"); }}}>Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WordsAdmin({ loveWords }: { loveWords: LoveWord[] }) {
  const [quote, setQuote] = useState("");
  const [author, setAuthor] = useState("Andre untuk Lulu");
  const [editing, setEditing] = useState<LoveWord | null>(null);
  const reset = ()=>{ setQuote(""); setAuthor("Andre untuk Lulu"); setEditing(null); };

  async function submit(){
    if(!quote) return toast.error("Tulis kata-katanya dulu");
    if (editing) { await updateLoveWord(editing.id, { quote, author }); toast.success("Diupdate"); }
    else { await addLoveWord({ quote, author }); toast.success("Ditambahkan"); }
    reset();
  }

  return (
    <div className="grid lg:grid-cols-[420px_1fr] gap-7">
      <div className="glass rounded-[20px] p-5">
        <div className="font-display text-[22px] mb-3">{editing ? "Edit kata cinta" : "Kata cinta baru"}</div>
        <label className="al-label">Kutipan</label>
        <textarea className="al-input mb-3" rows={4} value={quote} onChange={e=>setQuote(e.target.value)} placeholder="Aku akan memilihmu di semua kehidupan…" />
        <label className="al-label">Penulis</label>
        <input className="al-input mb-3" value={author} onChange={e=>setAuthor(e.target.value)} />
        <div className="flex gap-2">
          <button className="al-btn al-btn-primary" onClick={submit}>{editing ? "Simpan" : "Tambah"}</button>
          {editing && <button className="al-btn al-btn-ghost" onClick={reset}>Batal</button>}
        </div>
      </div>
      <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
        {loveWords.map(w=>(
          <div key={w.id} className="bg-white border border-[#f0cdd6] rounded-[14px] px-4 py-3 flex items-start justify-between gap-4">
            <div>
              <div className="font-serif text-[17px]">“{w.quote}”</div>
              <div className="text-xs text-[#9d5b68] mt-1">{w.author}</div>
            </div>
            <div className="flex gap-3 text-[12.5px] shrink-0">
              <button className="text-[#c03b60] font-semibold" onClick={()=>{ setEditing(w); setQuote(w.quote); setAuthor(w.author||""); }}>Edit</button>
              <button className="text-[#886067]" onClick={async()=>{ if(confirm("Hapus?")) { await deleteLoveWord(w.id); toast("Dihapus"); }}}>Hapus</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SiteAdmin({ settings }: { settings: SiteSettings }) {
  const [local, setLocal] = useState(settings);
  useEffect(()=>setLocal(settings), [settings.heroTitle, settings.backgroundMusicUrl]);

  async function save() {
    await saveSettings(local);
    toast.success("Pengaturan tersimpan • realtime aktif");
  }
  return (
    <div className="max-w-2xl">
      <div className="glass rounded-[20px] p-5 space-y-3">
        <div className="font-display text-[22px] mb-1">Website / Love Music</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="al-label">Judul Hero</label>
            <input className="al-input" value={local.heroTitle} onChange={e=>setLocal({...local, heroTitle: e.target.value})} />
          </div>
          <div>
            <label className="al-label">Tanggal Anniversary (ISO)</label>
            <input className="al-input" value={local.anniversaryISO} onChange={e=>setLocal({...local, anniversaryISO: e.target.value})} />
          </div>
        </div>
        <div>
          <label className="al-label">Subjudul</label>
          <input className="al-input" value={local.heroSubtitle} onChange={e=>setLocal({...local, heroSubtitle: e.target.value})} />
        </div>
        <div className="pt-2 border-t border-[#f0cad3]">
          <div className="font-serif text-[18px] text-[#6a3641]">Love Music Background</div>
        </div>
        <div>
          <label className="al-label">URL Musik (MP3)</label>
          <input className="al-input" value={local.backgroundMusicUrl} onChange={e=>setLocal({...local, backgroundMusicUrl: e.target.value})} placeholder="https://..." />
        </div>
        <div>
          <label className="al-label">Judul lagu</label>
          <input className="al-input" value={local.backgroundMusicTitle} onChange={e=>setLocal({...local, backgroundMusicTitle: e.target.value})} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={save} className="al-btn al-btn-primary">Simpan semua</button>
        </div>
        <p className="text-[12px] text-[#a95f6f]">Kalau musik diganti, semua pengunjung langsung dapat lagu baru secara realtime via Firestore onSnapshot(). Musik otomatis play saat buka website.</p>
      </div>
    </div>
  );
}

/* ---------- Background visuals ---------- */
function BackgroundRomance() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0" style={{
        background: "radial-gradient(1200px 800px at 75% -10%, #ffe4ea 0%, transparent 60%), radial-gradient(950px 700px at -10% 20%, #fff1d9 0%, transparent 55%), linear-gradient(180deg,#fff8f9 0%, #fff7f8 100%)"
      }}/>
      <div className="absolute inset-0 opacity-[.55]" style={{
        background: "radial-gradient(1300px 700px at 50% -10%, rgba(255,255,255,0.9), rgba(255,255,255,0) 60%)"
      }}/>
      <FloatingHearts />
      <PetalRain />
    </div>
  );
}

function FloatingHearts() {
  const hearts = useMemo(() => Array.from({length: 14}, (_,i)=>({
    id:i,
    left: Math.random()*100,
    size: 12 + Math.random()*18,
    delay: Math.random()*6,
    duration: 11 + Math.random()*10,
    opacity: .11 + Math.random()*0.15
  })),[])
  return (
    <div className="absolute inset-0 overflow-hidden">
      {hearts.map(h=>(
        <motion.div
          key={h.id}
          className="absolute text-[#ed6b8c]"
          style={{ left: h.left+"%", bottom: -40, fontSize: h.size, opacity: h.opacity }}
          animate={{ y: [-20, -900], x: [0, 16*Math.sin(h.id)], rotate: [0, 18] }}
          transition={{ duration: h.duration, repeat: Infinity, delay: h.delay, ease: "linear" }}
        >❤</motion.div>
      ))}
    </div>
  );
}

function PetalRain() {
  const petals = useMemo(()=> Array.from({length: 18}, (_,i)=>({
    id:i, left: Math.random()*100, delay: Math.random()*7, dur: 9+Math.random()*12, size: 10+Math.random()*14
  })),[]);
  return (
    <div className="absolute inset-0 overflow-hidden">
      {petals.map(p=>(
        <motion.div key={p.id}
          className="petal"
          style={{ left: p.left+"%", top: -30 }}
          animate={{ y: [0, 1050], rotate: [0, 240], x: [0, 30*Math.sin(p.id)] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: "linear" }}
        >
          <svg width={p.size} height={p.size*1.3} viewBox="0 0 24 32" fill="none">
            <path d="M12 30 C2 22 2 12 12 2 C22 12 22 22 12 30Z" fill="#ffc5d5" opacity="0.98"/>
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

function HeartPulse() {
  return (
    <motion.span
      animate={{ scale: [1, 1.18, 1] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      className="inline-block"
    >💗</motion.span>
  );
}
