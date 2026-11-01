'use client';

import { useEffect, useRef, useState } from 'react';
import useProfile from './useProfile';
import useGlassMotion from './useGlassMotion';
import { emailHref, whatsappHref } from '../lib/profile.mjs';

const rooms = [
  { id: 'profil', label: 'Profil', note: 'Tentang Sherlynda', x: 49, y: 27 },
  { id: 'pengalaman', label: 'Pengalaman', note: 'Magang & organisasi', x: 23, y: 48 },
  { id: 'galeri', label: 'Galeri', note: 'Dokumentasi kegiatan', x: 73, y: 53 },
  { id: 'sertifikat', label: 'Sertifikat', note: 'Arsip pembelajaran', x: 36, y: 76 },
  { id: 'kontak', label: 'Kontak', note: 'Mulai percakapan', x: 78, y: 82 },
];

function RoomIcon({ type }) {
  const paths = {
    profil: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    pengalaman: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V4h8v3M3 12l9 4 9-4M12 13v5" /></>,
    galeri: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="16" cy="9" r="2" /><path d="m3 17 5-6 6 7 3-3 4 4" /></>,
    sertifikat: <><path d="M14 3H5v18h14V8zM14 3v5h5" /><path d="M8 11h3M8 15h8M8 18h5" /></>,
    kontak: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="m2 6 10 8L22 6" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

function WorldMap({ active, select, name }) {
  const current = rooms.find(room => room.id === active);
  return <aside className="world-map" aria-label="Peta portofolio">
    <div className="map-heading"><span>PORTOFOLIO / JELAJAH</span><span className="map-coordinate">01—05</span></div>
    <div className="map-title"><h2>Ruang<br /><span>{name}.</span></h2><p>Pilih ruang untuk<br />mengenal ceritaku.</p></div>
    <div className="map-stage">
      <div className="map-floor" aria-hidden="true"><i /><i /><i /><i /></div>
      <svg className="map-routes" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M49 27 23 48 36 76 78 82 73 53 49 27M23 48 73 53 36 76" /><path className="route-flow" d="M49 27 23 48 36 76 78 82 73 53 49 27" /></svg>
      {rooms.map((room, index) => <button key={room.id} type="button" className={'map-node' + (active === room.id ? ' selected' : '')}
        style={{ '--node-x': room.x + '%', '--node-y': room.y + '%', '--float-delay': index * -.8 + 's' }}
        aria-pressed={active === room.id} onClick={() => select(room.id)}>
        <span className="node-platform"><RoomIcon type={room.id} /><span className="node-number">0{index + 1}</span></span>
        <span className="node-label">{room.label}</span>
      </button>)}
    </div>
    <div className="map-caption" aria-live="polite"><span className="map-indicator" /><div><small>RUANG TERPILIH</small><strong>{current.label}</strong></div><span aria-hidden="true">↗</span></div>
  </aside>;
}

function ProfileRoom({ data }) {
  return <div className="room-profile">
    <figure className="character-photo" data-glass-tilt>{data.portrait ? <img src={data.portrait} alt={'Foto ' + data.name} fetchPriority="high" /> : <div className="character-placeholder">{data.shortName?.[0]}</div>}<figcaption>{data.degree}</figcaption></figure>
    <div className="character-intro"><span className="room-tag">Fresh graduate</span><p className="room-lead">{data.intro}</p><dl><div><dt>Pendidikan</dt><dd>{data.degree}</dd></div><div><dt>Universitas</dt><dd>{data.university}</dd></div></dl></div>
    <div className="character-story"><h2>Tentang saya</h2><p>{data.bio}</p>{data.headline && <span className="profile-motto">{data.headline.split('\n').join(' / ')}</span>}</div>
  </div>;
}

function ExperienceRoom({ data }) {
  return <div className="room-experience"><div className="experience-period"><span>01 / MAGANG</span><span>{data.period || 'Kabupaten Malang'}</span></div><h2>{data.company}</h2><p className="experience-role">{data.role}</p><p className="room-body">{data.experience}</p>{data.experiencePhoto && <figure className="experience-photo"><img src={data.experiencePhoto} alt="Dokumentasi magang" loading="lazy" /><figcaption>{data.company}</figcaption></figure>}{data.organization.trim() && <section className="organization-story"><span className="room-eyebrow">02 / ORGANISASI</span><h2>{data.organization}</h2><p className="room-body">{data.organizationDetail}</p></section>}</div>;
}

function GalleryRoom({ items, open }) {
  const photos = items.map((item, index) => ({ ...item, index })).filter(item => item.image);
  return photos.length ? <div className="room-gallery">{photos.map((item, index) => <figure key={item.id || item.index} className="gallery-memory" style={{ '--entry-delay': Math.min(index, 5) * 70 + 'ms' }}><button type="button" onClick={() => open(item.index)} aria-label={'Lihat foto: ' + (item.caption || 'Dokumentasi')}><img src={item.image} alt={item.caption || 'Dokumentasi kegiatan'} loading="lazy" /><span aria-hidden="true">↗</span></button><figcaption><small>FRAME / {String(index + 1).padStart(2, '0')}</small><h2>{item.caption || 'Dokumentasi kegiatan'}</h2>{item.description && <p>{item.description}</p>}</figcaption></figure>)}</div> : <EmptyRoom type="galeri">Dokumentasi kegiatan belum ditambahkan.</EmptyRoom>;
}

function EmptyRoom({ type, children }) {
  return <div className="room-empty"><RoomIcon type={type} /><p>{children}</p></div>;
}

function CertificateRoom({ items }) {
  return items.length ? <div className="room-archive">{items.map((item, index) => <article key={item.id || index} className="archive-record"><span className="archive-index">{String(index + 1).padStart(2, '0')}</span>{item.image && <img src={item.image} alt={item.title || 'Sertifikat'} loading="lazy" />}<div><h2>{item.title || 'Sertifikat'}</h2><p className="archive-meta">{[item.issuer, item.date].filter(Boolean).join(' / ')}</p>{item.description && <p className="room-body">{item.description}</p>}<div className="archive-links">{item.document && <a href={item.document} target="_blank" rel="noopener noreferrer">Buka PDF ↗</a>}{item.image && <a href={item.image} target="_blank" rel="noopener noreferrer">Lihat gambar ↗</a>}{item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer">Kredensial ↗</a>}</div></div></article>)}</div> : <EmptyRoom type="sertifikat">Sertifikat belum ditambahkan.</EmptyRoom>;
}

function ContactRoom({ data }) {
  const email = emailHref(data.email), whatsapp = whatsappHref(data.phone);
  return <div className="room-contact"><div className="contact-emblem" aria-hidden="true"><RoomIcon type="kontak" /></div><h2>Mari berbincang.</h2><p>Untuk peluang kerja, kolaborasi,<br />atau percakapan baru.</p><div className="contact-destinations">{email && <a href={email}><span><small>EMAIL</small>{data.email}</span><span aria-hidden="true">↗</span></a>}{whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer"><span><small>WHATSAPP</small>{data.phone}</span><span aria-hidden="true">↗</span></a>}</div></div>;
}

export default function Portfolio({ preview = false }) {
  const { data, replaceData } = useProfile({ livePreview: preview });
  const [active, setActive] = useState('profil');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [year, setYear] = useState(2026);
  const scope = useRef(null), detail = useRef(null), dialog = useRef(null);
  useGlassMotion(scope, true);
  const roomIndex = rooms.findIndex(room => room.id === active);
  const room = rooms[roomIndex];
  const gallery = data.gallery || [];
  const photo = selectedPhoto === null ? null : gallery[selectedPhoto];

  useEffect(() => { setYear(new Date().getFullYear()); if (location.hash) history.replaceState(null, '', location.pathname + location.search); }, []);
  useEffect(() => {
    if (!preview) return;
    const receive = event => {
      if (event.source === window.parent && event.origin === location.origin && event.data?.type === 'portfolio-preview') replaceData(event.data.data);
    };
    addEventListener('message', receive);
    window.parent.postMessage({ type: 'portfolio-ready' }, location.origin);
    return () => removeEventListener('message', receive);
  }, [preview, replaceData]);
  useEffect(() => {
    if (selectedPhoto === null) { if (dialog.current?.open) dialog.current.close(); return; }
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [selectedPhoto]);

  function selectRoom(id) {
    setActive(id);
    if (scrollY > 100 || innerWidth < 900) detail.current?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  }

  return <div ref={scope} className="portfolio-world">
    <div className="world-atmosphere" aria-hidden="true"><i /><i /><div className="world-orbit" /></div>
    <a href="#room-content" className="world-skip" onClick={event => { event.preventDefault(); detail.current?.focus(); }}>Langsung ke konten</a>
    <header className="world-header"><button className="world-wordmark" type="button" onClick={() => selectRoom('profil')}><span className="wordmark-mark">s.</span><span>{data.shortName}<small>PORTOFOLIO</small></span></button><span className="world-header-note">Pendidikan · Pengalaman · Dokumentasi</span><button className="world-contact-button" type="button" onClick={() => selectRoom('kontak')}>Hubungi saya <span aria-hidden="true">↗</span></button></header>
    <div className="world-layout"><WorldMap active={active} select={selectRoom} name={data.shortName} />
      <main ref={detail} id="room-content" className="world-detail" tabIndex={-1} aria-labelledby="world-room-title">
        <div className="room-window-bar"><span><i />{room.label}</span><div><button type="button" onClick={() => selectRoom(rooms[(roomIndex + rooms.length - 1) % rooms.length].id)} aria-label="Ruang sebelumnya">←</button><small>0{roomIndex + 1} / 05</small><button type="button" onClick={() => selectRoom(rooms[(roomIndex + 1) % rooms.length].id)} aria-label="Ruang berikutnya">→</button></div></div>
        <div key={active} className="room-content"><div className="room-title"><span className="room-eyebrow">{room.note}</span><h1 id="world-room-title">{active === 'profil' ? data.name : room.label}<span>.</span></h1></div>
          {active === 'profil' && <ProfileRoom data={data} />}{active === 'pengalaman' && <ExperienceRoom data={data} />}{active === 'galeri' && <GalleryRoom items={gallery} open={setSelectedPhoto} />}{active === 'sertifikat' && <CertificateRoom items={data.certificates || []} />}{active === 'kontak' && <ContactRoom data={data} />}
        </div><div className="room-bottom"><span>{data.shortName} / {room.label}</span><span aria-hidden="true">↗</span></div>
      </main>
    </div>
    <nav className="world-mobile-nav" aria-label="Pilih ruang">{rooms.map(room => <button type="button" key={room.id} aria-pressed={active === room.id} onClick={() => selectRoom(room.id)}><RoomIcon type={room.id} /><span>{room.label}</span></button>)}</nav>
    <footer className="world-footer"><span>© {year} {data.name}</span><span>Portofolio pribadi</span></footer>
    <dialog className="world-photo-modal" ref={dialog} onCancel={() => setSelectedPhoto(null)} onClose={() => setSelectedPhoto(null)} onClick={event => { if (event.target === event.currentTarget) setSelectedPhoto(null); }} aria-label={photo?.caption || 'Detail foto'}>{photo && <div><button className="photo-modal-close" type="button" onClick={() => setSelectedPhoto(null)}>Tutup ×</button><img src={photo.image} alt={photo.caption || 'Dokumentasi kegiatan'} /><div className="photo-modal-caption"><h2>{photo.caption}</h2>{photo.description && <p>{photo.description}</p>}</div></div>}</dialog>
  </div>;
}
