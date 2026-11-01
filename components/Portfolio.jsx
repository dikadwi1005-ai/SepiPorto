'use client';

import { useEffect, useRef, useState } from 'react';
import useProfile from './useProfile';
import useGlassMotion from './useGlassMotion';
import { Daisy, GardenSprig, Butterfly } from './FlowerArt';
import { sectionAtViewport } from '../lib/navigation.mjs';
import { emailHref, whatsappHref } from '../lib/profile.mjs';

const chapters = [['kenalan', 'Kenalan'], ['perjalanan', 'Perjalanan'], ['album', 'Album'], ['sertifikat', 'Sertifikat'], ['sapa', 'Sapa']];

function ChapterTitle({ number, children, note }) {
  return <div className="journal-chapter-title"><span className="journal-index">{number} / {note}</span><h2>{children}</h2></div>;
}

function Certificate({ item, index }) {
  return <article className="journal-certificate"><span className="certificate-number">{String(index + 1).padStart(2, '0')}</span>{item.image && <a className="certificate-preview" href={item.image} target="_blank" rel="noopener noreferrer"><img src={item.image} alt={item.title || 'Sertifikat'} loading="lazy" /></a>}<div className="certificate-details"><h3>{item.title || 'Sertifikat'}</h3><p className="certificate-meta">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p>{item.description && <p>{item.description}</p>}<div className="certificate-actions">{item.document && <a href={item.document} target="_blank" rel="noopener noreferrer">Buka PDF ↗</a>}{item.image && <a href={item.image} target="_blank" rel="noopener noreferrer">Lihat gambar ↗</a>}{item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer">Kredensial ↗</a>}</div></div></article>;
}

export default function Portfolio({ preview = false }) {
  const { data, replaceData } = useProfile({ livePreview: preview });
  const [active, setActive] = useState('kenalan');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [year, setYear] = useState(2026);
  const scope = useRef(null), dialog = useRef(null), intent = useRef(null);
  useGlassMotion(scope, true);
  const gallery = data.gallery || [];
  const photos = gallery.map((item, index) => ({ ...item, index })).filter(item => item.image);
  const certificates = data.certificates || [];
  const photo = selectedPhoto === null ? null : gallery[selectedPhoto];
  const email = emailHref(data.email), whatsapp = whatsappHref(data.phone);

  useEffect(() => { setYear(new Date().getFullYear()); if (location.hash) history.replaceState(null, '', location.pathname + location.search); }, []);
  useEffect(() => {
    if (!preview) return;
    const receive = event => { if (event.source === window.parent && event.origin === location.origin && event.data?.type === 'portfolio-preview') replaceData(event.data.data); };
    addEventListener('message', receive);
    window.parent.postMessage({ type: 'portfolio-ready' }, location.origin);
    return () => removeEventListener('message', receive);
  }, [preview, replaceData]);
  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (intent.current) return;
        const positions = chapters.map(([id]) => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Infinity }));
        const current = sectionAtViewport(positions, innerHeight);
        setActive(current === 'utama' ? 'kenalan' : current);
      });
    };
    const finish = () => { intent.current = null; };
    const interrupt = () => { finish(); update(); };
    const key = event => { if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt(); };
    update();
    addEventListener('scroll', update, { passive: true }); addEventListener('resize', interrupt); addEventListener('scrollend', finish);
    addEventListener('wheel', interrupt, { passive: true }); addEventListener('touchstart', interrupt, { passive: true }); addEventListener('keydown', key);
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', update); removeEventListener('resize', interrupt); removeEventListener('scrollend', finish); removeEventListener('wheel', interrupt); removeEventListener('touchstart', interrupt); removeEventListener('keydown', key); };
  }, []);
  useEffect(() => {
    if (selectedPhoto === null) { if (dialog.current?.open) dialog.current.close(); return; }
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [selectedPhoto]);

  function navigate(event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = link.getAttribute('href').slice(1), target = document.getElementById(id);
    if (!target) return;
    event.preventDefault(); intent.current = id; setActive(id);
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }

  return <div ref={scope} className="garden-journal" onClick={navigate}>
    <div className="garden-atmosphere" aria-hidden="true"><i /><i /><span className="drifting-petal petal-one" /><span className="drifting-petal petal-two" /><span className="drifting-petal petal-three" /></div>
    <a className="journal-skip" href="#kenalan">Langsung ke konten</a>
    <header className="journal-header"><a className="journal-signature" href="#kenalan"><Daisy />{data.shortName}<span>’s journal</span></a><nav aria-label="Navigasi portofolio">{chapters.map(([id, label]) => <a key={id} href={'#' + id} aria-current={active === id ? 'location' : undefined}>{label}</a>)}</nav></header>
    <main>
      <section id="kenalan" className="journal-cover journal-wrap">
        <div className="cover-note"><span>PORTOFOLIO PRIBADI</span><span>Pendidikan · Cerita · Kenangan</span></div>
        <div className="cover-photo-area"><GardenSprig className="cover-blooms" /><figure className="cover-portrait" data-glass-tilt><div className="portrait-mat">{data.portrait ? <img src={data.portrait} alt={'Foto ' + data.name} fetchPriority="high" /> : <div className="portrait-placeholder">{data.shortName?.[0]}</div>}</div><figcaption>{data.name}<Daisy /></figcaption></figure><Butterfly className="cover-butterfly" /><span className="photo-handnote">senang berkenalan ♡</span></div>
        <div className="cover-greeting"><span className="greeting-line">Sedikit tentang aku</span><h1>Halo, aku<br /><em>{data.shortName}.</em></h1><p className="full-name">{data.name}</p><div className="greeting-note"><span className="note-pin" aria-hidden="true" /><p>{data.intro}</p><a className="journal-link" href="#perjalanan">Kenali perjalananku <span aria-hidden="true">↓</span></a></div><span className="cover-flower-note">bunga, warna pink, dan cerita kecil.</span></div>
        <div className="about-note"><span className="journal-index">01 / KENALAN</span><div><p>{data.bio}</p><dl><div><dt>Pendidikan</dt><dd>{data.degree}</dd></div><div><dt>Kampus</dt><dd>{data.university}</dd></div></dl></div><Daisy className="about-daisy" /></div>
      </section>

      <section id="perjalanan" className="journal-journey journal-wrap journal-section"><ChapterTitle number="02" note="PERJALANAN">Catatan dari<br /><em>ruang belajar.</em></ChapterTitle><div className="journey-layout"><div className="journey-margin"><GardenSprig className="journey-sprig" mirror /><p>{data.headline?.split('\n').join(' / ')}</p></div><div className="journey-entries"><article className="journey-entry"><div className="entry-topline"><span>Pengalaman magang</span><span>{data.period || 'Kabupaten Malang'}</span></div><h3>{data.company}</h3><p className="entry-role">{data.role}</p><p className="entry-story">{data.experience}</p>{data.experiencePhoto && <figure className="journey-photo"><img src={data.experiencePhoto} alt="Dokumentasi magang" loading="lazy" /><figcaption>Sepotong cerita dari masa magang.</figcaption></figure>}</article>{data.organization.trim() && <article className="journey-entry organization-entry"><span className="journal-index">ORGANISASI</span><h3>{data.organization}</h3><p className="entry-story">{data.organizationDetail}</p></article>}</div></div></section>

      <section id="album" className="journal-album journal-wrap journal-section"><div className="album-heading"><ChapterTitle number="03" note="ALBUM">Momen kecil,<br /><em>kenangan manis.</em></ChapterTitle><p>Dokumentasi kegiatan<br />dan cerita di baliknya.</p><Daisy className="album-daisy" /></div>{photos.length ? <div className="album-grid">{photos.map((item, index) => <figure key={item.id || item.index} className="album-photo" style={{ '--photo-angle': index % 2 ? '2deg' : '-2deg', '--photo-delay': index % 3 * -1.2 + 's' }}><button type="button" onClick={() => setSelectedPhoto(item.index)} aria-label={'Lihat foto: ' + (item.caption || 'Dokumentasi kegiatan')}><img src={item.image} alt={item.caption || 'Dokumentasi kegiatan'} loading="lazy" /><span aria-hidden="true">↗</span></button><figcaption><span className="album-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{item.caption || 'Dokumentasi kegiatan'}</h3>{item.description && <p>{item.description}</p>}</div></figcaption></figure>)}</div> : <div className="journal-empty"><Daisy /><p>Album ini sedang menunggu<br />cerita dan foto berikutnya.</p></div>}</section>

      <section id="sertifikat" className="journal-certificates journal-wrap journal-section"><ChapterTitle number="04" note="SERTIFIKAT">Hal-hal yang<br /><em>kupelajari.</em></ChapterTitle><div className="certificate-paper"><span className="paper-corner" aria-hidden="true" /><Daisy className="certificate-daisy" />{certificates.length ? certificates.map((item, index) => <Certificate item={item} index={index} key={item.id || index} />) : <p className="certificate-empty">Sertifikat dan dokumentasi pembelajaran<br />akan ditambahkan di sini.</p>}</div></section>

      <section id="sapa" className="journal-contact journal-wrap journal-section"><div className="contact-garden"><GardenSprig className="contact-sprig" /><ChapterTitle number="05" note="SAPA">Kirim<br /><em>sapaan.</em></ChapterTitle></div><div className="contact-letter"><Daisy className="letter-seal" /><p>Untuk peluang kerja, kolaborasi,<br />atau sekadar menyapa.</p>{email && <a className="letter-email" href={email}>{data.email}<span aria-hidden="true">↗</span></a>}{whatsapp && <a className="journal-link" href={whatsapp} target="_blank" rel="noopener noreferrer">Sapa lewat WhatsApp <span aria-hidden="true">↗</span></a>}<span className="letter-signature">{data.shortName} ♡</span></div></section>
    </main>
    <footer className="journal-footer journal-wrap"><span>© {year} {data.name}</span><a href="#kenalan">Kembali ke atas ↑</a></footer>
    <dialog className="journal-photo-modal" ref={dialog} onCancel={() => setSelectedPhoto(null)} onClose={() => setSelectedPhoto(null)} onClick={event => { if (event.target === event.currentTarget) setSelectedPhoto(null); }} aria-label={photo?.caption || 'Detail foto'}>{photo && <div><button type="button" className="photo-modal-close" onClick={() => setSelectedPhoto(null)}>Tutup ×</button><img src={photo.image} alt={photo.caption || 'Dokumentasi kegiatan'} /><div className="photo-modal-caption"><h2>{photo.caption}</h2>{photo.description && <p>{photo.description}</p>}</div></div>}</dialog>
  </div>;
}
