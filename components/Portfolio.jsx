'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import useProfile from './useProfile';
import seed from '../data/portfolio.json';
import { emailHref, whatsappHref } from '../lib/profile.mjs';

const sections = [['tentang', 'Tentang'], ['pengalaman', 'Pengalaman'], ['galeri', 'Galeri'], ['sertifikat', 'Sertifikat']];

function ImagePlaceholder({ number = 'S', className = '' }) {
  return <div className={'image-placeholder ' + className} aria-hidden="true"><span>{number}</span><i /><i /></div>;
}

export default function Portfolio({ preview = false }) {
  const { data, replaceData } = useProfile({ livePreview: preview });
  const [menuOpen, setMenuOpen] = useState(false);
  const [motion, setMotion] = useState(false);
  const [progress, setProgress] = useState(0);
  const [year, setYear] = useState(2026);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const dialog = useRef(null);
  const scope = useRef(null);

  useEffect(() => { setYear(new Date().getFullYear()); if (location.hash) history.replaceState(null, '', location.pathname + location.search); }, []);
  useEffect(() => {
    if (!preview) return;
    function receive(event) {
      if (event.source !== window.parent || event.origin !== location.origin || event.data?.type !== 'portfolio-preview') return;
      replaceData(event.data.data);
    }
    addEventListener('message', receive);
    window.parent.postMessage({ type: 'portfolio-ready' }, location.origin);
    return () => removeEventListener('message', receive);
  }, [preview, replaceData]);

  useEffect(() => {
    if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setMotion(true);
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('seen'); observer.unobserve(entry.target); }
    }), { threshold: .06 });
    scope.current.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [data]);

  useEffect(() => {
    let frame;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const distance = document.documentElement.scrollHeight - innerHeight;
        setProgress(distance > 0 ? Math.min(100, scrollY / distance * 100) : 0);
      });
    }
    update();
    addEventListener('scroll', update, { passive: true });
    const onEscape = event => { if (event.key === 'Escape') setMenuOpen(false); };
    addEventListener('keydown', onEscape);
    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', update); removeEventListener('keydown', onEscape); };
  }, []);

  useEffect(() => {
    if (selectedPhoto === null) { if (dialog.current?.open) dialog.current.close(); return; }
    dialog.current?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [selectedPhoto]);

  const email = emailHref(data.email);
  const whatsapp = whatsappHref(data.phone);
  const gallery = data.gallery || [];
  const certificates = data.certificates || [];
  const photo = selectedPhoto === null ? null : gallery[selectedPhoto];
  function navigateSection(event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  function closeMenu() { setMenuOpen(false); }

  return <div ref={scope} onClick={navigateSection} className={'portfolio-site' + (motion ? ' motion' : '')}>
    <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
    <div className="progress" style={{ width: progress + '%' }} aria-hidden="true" />
    <a className="skip" href="#utama">Langsung ke konten</a>
    <header className="site-header"><a className="brand" href="#utama" onClick={closeMenu}>{data.shortName.toLowerCase()}<span>.</span></a>
      <button className="menu-button" aria-controls="navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>Menu <span aria-hidden="true">☰</span></button>
      <nav id="navigation" className={menuOpen ? 'open' : ''} aria-label="Navigasi utama">{sections.map(([id, label]) => <a key={id} href={'#' + id} onClick={closeMenu}>{label}</a>)}<a className="nav-contact" href="#kontak" onClick={closeMenu}>Say hello <span aria-hidden="true">↗</span></a></nav>
    </header>
    <main id="utama">
      <section className="hero wrap"><div className="hero-copy"><div className="eyebrow"><span className="status-dot" />A little space, a growing story</div><p className="hello">Halo, saya {data.shortName} <span aria-hidden="true">✧</span></p>
        <h1>{(data.headline || seed.headline).split('\n').slice(0, 4).map((line, i) => <Fragment key={i}>{i > 0 && <br />}{i === 1 ? <em>{line}</em> : <span>{line}</span>}</Fragment>)}</h1>
        <p className="hero-intro">{data.intro}</p><div className="hero-actions"><a className="button primary" href="#pengalaman">Kenali perjalanan saya <span aria-hidden="true">↗</span></a><a className="soft-link" href="#galeri">Lihat galeri <span aria-hidden="true">↓</span></a></div>
        <div className="hero-caption"><span>FRESH GRADUATE</span><i />{data.degree}</div>
      </div><div className="hero-visual"><div className="portrait-halo" aria-hidden="true" /><div className="portrait-frame">{data.portrait ? <img src={data.portrait} alt={'Foto ' + data.name} fetchPriority="high" /> : <ImagePlaceholder number={(data.shortName || 'S')[0]} className="portrait-placeholder" />}<div className="portrait-label"><span>{data.name}</span><small>one step at a time</small></div></div><div className="floating-note"><span aria-hidden="true">✦</span><div>Rooted in curiosity.<small>Growing every day.</small></div></div><span className="hero-spark" aria-hidden="true">✳</span></div></section>

      <div className="chapter-strip wrap"><span>Belajar dari pengalaman</span><i aria-hidden="true">✧</i><span>Bertumbuh lewat perjalanan</span><i aria-hidden="true">✧</i><span>Menemukan hal baru</span></div>

      <section id="tentang" className="wrap about"><div className="about-heading reveal"><div className="eyebrow">01 / Behind the story</div><h2>Lebih dari sebuah<br /><em>nama di atas kertas.</em></h2><p>Setiap proses punya cerita.<br />Ini sedikit tentang saya.</p></div><div className="glass about-copy reveal"><span className="card-flower" aria-hidden="true">✧</span><p>{data.bio}</p><div className="education"><span className="education-icon" aria-hidden="true">↗</span><div><strong>{data.degree}</strong><p>{data.university}</p><small>Fresh graduate</small></div></div></div></section>

      <section id="pengalaman" className="section-tinted"><div className="wrap"><div className="section-head reveal"><div><div className="eyebrow">02 / Learning by doing</div><h2>Langkah kecil.<br /><em>Pengalaman berarti.</em></h2></div><p>Dari ruang belajar hingga pengalaman langsung di lingkungan pendidikan.</p></div><article className="glass experience-card reveal"><div className="experience-art">{data.experiencePhoto ? <img src={data.experiencePhoto} alt="Dokumentasi pengalaman magang" loading="lazy" /> : <ImagePlaceholder number="RBA" />}<span className="art-label">FIELD NOTES / PENDIDIKAN</span></div><div className="experience-content"><span className="chip">Pengalaman magang</span><h3>{data.company}</h3><strong className="role">{data.role}</strong><p>{data.experience}</p><div className="experience-foot"><span>{data.period || 'Kabupaten Malang'}</span><span aria-hidden="true">01 ↗</span></div></div></article>{data.organization.trim() && <article className="glass org reveal"><span className="idx">02</span><div><span className="eyebrow">Organisasi</span><h3>{data.organization}</h3><p>{data.organizationDetail}</p></div><span aria-hidden="true">↗</span></article>}</div></section>

      <section id="galeri" className="wrap"><div className="section-head reveal"><div><div className="eyebrow">03 / A visual diary</div><h2>Momen yang tersimpan.<br /><em>Cerita yang bertumbuh.</em></h2></div><p>Dokumentasi kegiatan dan potongan perjalanan yang ingin saya kenang.</p></div><div className="gallery-grid">{gallery.map((item, index) => <article className="gallery-item glass reveal" key={item.id || index}>{item.image ? <button className="gallery-open" onClick={() => setSelectedPhoto(index)} aria-label={'Lihat foto: ' + (item.caption || 'Dokumentasi ' + (index + 1))}><img src={item.image} alt={item.caption || 'Dokumentasi kegiatan'} loading="lazy" /><span aria-hidden="true">↗</span></button> : <ImagePlaceholder number={String(index + 1).padStart(2, '0')} />}<div className="gallery-copy"><small>MOMENT / {String(index + 1).padStart(2, '0')}</small><h3>{item.caption || 'Sebuah momen'}</h3>{item.description && <p>{item.description}</p>}{!item.image && <p className="empty-caption">Dokumentasi akan ditambahkan.</p>}</div></article>)}</div>{gallery.length === 0 && <div className="glass empty-state"><span aria-hidden="true">▧</span><h3>Ruang untuk cerita berikutnya.</h3><p>Dokumentasi kegiatan akan hadir di sini.</p></div>}</section>

      <section id="sertifikat" className="section-tinted certificates-section"><div className="wrap"><div className="section-head reveal"><div><div className="eyebrow">04 / Little milestones</div><h2>Terus belajar.<br /><em>Merayakan setiap langkah.</em></h2></div><p>Sertifikat, pelatihan, dan jejak pembelajaran sepanjang perjalanan.</p></div>{certificates.length ? <div className="certificate-grid">{certificates.map((item, index) => <article className="glass certificate-card reveal" key={item.id || index}><div className="certificate-cover">{item.image ? <img src={item.image} alt={item.title || 'Sertifikat'} loading="lazy" /> : <div className="certificate-symbol" aria-hidden="true">✺</div>}<span className="chip">{item.document ? 'PDF / Sertifikat' : 'Sertifikat'}</span></div><div className="certificate-copy"><p className="certificate-meta">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p><h3>{item.title || 'Sertifikat pembelajaran'}</h3>{item.description && <p>{item.description}</p>}<div className="certificate-links">{(item.document || item.image) && <a href={item.document || item.image} target="_blank" rel="noopener noreferrer">{item.document ? 'Buka PDF ↗' : 'Lihat sertifikat ↗'}</a>}{item.document && item.image && <a href={item.image} target="_blank" rel="noopener noreferrer">Lihat gambar ↗</a>}{item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer">Kredensial ↗</a>}</div></div></article>)}</div> : <div className="glass empty-state certificate-empty"><span aria-hidden="true">✺</span><div><h3>Perjalanan belajar masih berlanjut.</h3><p>Sertifikat dan dokumentasi pembelajaran akan ditampilkan di sini.</p></div></div>}</div></section>

      <section id="kontak" className="wrap"><div className="glass contact reveal"><div><div className="eyebrow">05 / Let's connect</div><h2>Setiap cerita baru<br />dimulai dari <em>halo.</em></h2><p>Untuk peluang kerja, kolaborasi, atau bertukar cerita.</p></div><div className="contact-actions">{email && <a className="email-link" href={email}>{data.email}</a>}{whatsapp && <a className="button primary" href={whatsapp} target="_blank" rel="noopener noreferrer">Mari berbincang <span aria-hidden="true">↗</span></a>}</div><span className="contact-flower" aria-hidden="true">✧</span></div></section>
    </main><footer className="wrap footer"><span>© {year} {data.name}</span><div><a href="#utama">Kembali ke atas ↑</a></div></footer>
    <dialog className="photo-dialog" ref={dialog} onCancel={() => setSelectedPhoto(null)} onClose={() => setSelectedPhoto(null)} onClick={event => { if (event.target === event.currentTarget) setSelectedPhoto(null); }} aria-label={photo?.caption || 'Detail foto'}>{photo && <div className="photo-dialog-content"><button className="dialog-close" onClick={() => setSelectedPhoto(null)} aria-label="Tutup foto">✕</button><img src={photo.image} alt={photo.caption || 'Dokumentasi kegiatan'} /><div><small>THE VISUAL DIARY</small><h3>{photo.caption}</h3>{photo.description && <p>{photo.description}</p>}</div></div>}</dialog>
  </div>;
}
