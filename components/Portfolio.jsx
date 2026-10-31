'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import useProfile from './useProfile';
import seed from '../data/portfolio.json';
import { emailHref, whatsappHref } from '../lib/profile.mjs';

const sections = [['utama', 'Beranda', '⌂'], ['tentang', 'Tentang saya', '✳'], ['pengalaman', 'Pengalaman', '↗'], ['galeri', 'Visual diary', '▧'], ['sertifikat', 'Pencapaian', '✺']];

function ImagePlaceholder({ number = 'S', className = '' }) {
  return <div className={'image-placeholder ' + className} aria-hidden="true"><span>{number}</span><i /><i /></div>;
}

export default function Portfolio({ preview = false }) {
  const { data, replaceData } = useProfile({ livePreview: preview });
  const [activeSection, setActiveSection] = useState('utama');
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

    return () => { cancelAnimationFrame(frame); removeEventListener('scroll', update);  };
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
    setActiveSection(target.id);
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible[0]) setActiveSection(visible[0].target.id === 'featured' ? 'utama' : visible[0].target.id);
    }, { rootMargin: '-10% 0px -55% 0px', threshold: [0, .1, .5] });
    document.querySelectorAll('#utama .hero, #tentang, #pengalaman, #galeri, #sertifikat').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return <div ref={scope} onClick={navigateSection} className={'portfolio-site' + (motion ? ' motion' : '')}>
    <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
    <div className="progress" style={{ width: progress + '%' }} aria-hidden="true" />
    <a className="skip" href="#utama">Langsung ke konten</a>
    <aside className="creative-sidebar"><a className="universe-brand" href="#utama"><span className="universe-mark">s<span>✳</span></span><span>{data.shortName.toLowerCase()}<small>THE PERSONAL UNIVERSE</small></span></a>
      <div className="sidebar-label">EXPLORE MY WORLD <span>↙</span></div>
      <nav className="universe-nav" aria-label="Navigasi utama">{sections.map(([id, label, icon]) => <a key={id} href={'#' + id} className={activeSection === id ? 'current' : ''} aria-current={activeSection === id ? 'location' : undefined}><span aria-hidden="true">{icon}</span><span>{label}</span><i aria-hidden="true">↗</i></a>)}</nav>
      <div className="sidebar-collection"><span>MY COLLECTION</span><a href="#galeri"><i className="collection-swatch pink-swatch">▧</i><div>Little moments<small>{gallery.filter(item => item.image).length} foto tersimpan</small></div><span>↗</span></a><a href="#sertifikat"><i className="collection-swatch lilac-swatch">✺</i><div>Little milestones<small>{certificates.length} pencapaian</small></div><span>↗</span></a></div>
      <a className="sidebar-quest" href="#kontak"><span className="quest-star" aria-hidden="true">✦</span><small>NEXT CHAPTER</small><strong>Let's make<br />something matter.</strong><span className="quest-link">Mulai percakapan <i>↗</i></span></a><div className="sidebar-signature"><span className="status-dot" /> Made of stories & curiosity.</div>
    </aside>
    <div className="creative-topbar"><div className="topbar-location"><span aria-hidden="true">✳</span> PORTFOLIO <i>/</i> <strong>MY UNIVERSE</strong></div><a href="#kontak" className="topbar-contact">Let's connect <span>↗</span></a><a href="#tentang" className="topbar-avatar" aria-label="Tentang Sherlynda">{data.portrait ? <img src={data.portrait} alt="" /> : data.shortName[0]}</a></div>
    <main id="utama"><div className="universe-welcome wrap"><div><p>HEY THERE, WELCOME TO MY SPACE <span>✦</span></p><h2>A collection <em>of me.</em></h2></div><span className="welcome-stamp">A WORK IN<br /><strong>PROGRESS ↗</strong></span></div>
      <section id="featured" className="hero wrap"><span className="hero-edition">THE INTRODUCTION / VOL. 01</span><div className="hero-copy"><div className="eyebrow"><span className="status-dot" />MEET THE MAIN CHARACTER</div><p className="hello">Halo, saya {data.shortName} <span aria-hidden="true">✧</span></p>
        <h1>{(data.headline || seed.headline).split('\n').slice(0, 4).map((line, i) => <Fragment key={i}>{i > 0 && <br />}{i === 1 ? <em>{line}</em> : <span>{line}</span>}</Fragment>)}</h1>
        <p className="hero-intro">{data.intro}</p><div className="hero-actions"><a className="button primary" href="#pengalaman">Explore my story <span aria-hidden="true">↗</span></a><a className="soft-link" href="#galeri">Lihat galeri <span aria-hidden="true">↓</span></a></div>
        <div className="hero-caption"><span>FRESH GRADUATE</span><i />{data.degree}</div>
      </div><div className="hero-visual"><div className="portrait-halo" aria-hidden="true" /><div className="portrait-frame">{data.portrait ? <img src={data.portrait} alt={'Foto ' + data.name} fetchPriority="high" /> : <ImagePlaceholder number={(data.shortName || 'S')[0]} className="portrait-placeholder" />}<div className="portrait-label"><span>{data.name}</span><small>one step at a time</small></div></div><div className="floating-note"><span aria-hidden="true">✦</span><div>New chapter unlocked.<small>Fresh graduate, endless possibilities.</small></div></div><span className="hero-spark" aria-hidden="true">✳</span></div></section>

      <div className="collection-heading wrap"><h2>Pick your next chapter<span>.</span></h2><span>SETIAP BAGIAN PUNYA CERITA ↘</span></div>
      <div className="chapter-deck wrap"><a className="chapter-tile chapter-story" href="#tentang"><span className="tile-number">01 / THE PERSON</span><span className="tile-art" aria-hidden="true">✳</span><div><h3>Behind the story.</h3><p>Kenalan lebih dekat</p></div><i>↗</i></a><a className="chapter-tile chapter-field" href="#pengalaman"><span className="tile-number">02 / THE JOURNEY</span><span className="tile-art" aria-hidden="true">↗</span><div><h3>Learning by doing.</h3><p>Catatan dari lapangan</p></div><i>↗</i></a><a className="chapter-tile chapter-moments" href="#galeri"><span className="tile-number">03 / THE MOMENTS</span><span className="tile-art" aria-hidden="true">▧</span><div><h3>Life in little frames.</h3><p>Buka visual diary</p></div><i>↗</i></a></div>

      <section id="tentang" className="wrap about"><div className="about-heading reveal"><div className="eyebrow">01 / Behind the story</div><h2>The person<br /><em>behind the pixels.</em></h2><p>Setiap proses punya cerita.<br />Ini sedikit tentang saya.</p></div><div className="glass about-copy reveal"><span className="card-flower" aria-hidden="true">✧</span><p>{data.bio}</p><div className="education"><span className="education-icon" aria-hidden="true">↗</span><div><strong>{data.degree}</strong><p>{data.university}</p><small>Fresh graduate</small></div></div></div></section>

      <section id="pengalaman" className="section-tinted"><div className="wrap"><div className="section-head reveal"><div><div className="eyebrow">02 / Learning by doing</div><h2>Learning mode:<br /><em>always on.</em></h2></div><p>Dari ruang belajar hingga pengalaman langsung di lingkungan pendidikan.</p></div><article className="glass experience-card reveal"><div className="experience-art">{data.experiencePhoto ? <img src={data.experiencePhoto} alt="Dokumentasi pengalaman magang" loading="lazy" /> : <ImagePlaceholder number="RBA" />}<span className="art-label">FIELD NOTES / PENDIDIKAN</span></div><div className="experience-content"><span className="chip">Pengalaman magang</span><h3>{data.company}</h3><strong className="role">{data.role}</strong><p>{data.experience}</p><div className="experience-foot"><span>{data.period || 'Kabupaten Malang'}</span><span aria-hidden="true">01 ↗</span></div></div></article>{data.organization.trim() && <article className="glass org reveal"><span className="idx">02</span><div><span className="eyebrow">Organisasi</span><h3>{data.organization}</h3><p>{data.organizationDetail}</p></div><span aria-hidden="true">↗</span></article>}</div></section>

      <section id="galeri" className="wrap"><div className="section-head reveal"><div><div className="eyebrow">03 / A visual diary</div><h2>My camera roll.<br /><em>My kind of memories.</em></h2></div><p>Dokumentasi kegiatan dan potongan perjalanan yang ingin saya kenang.</p></div><div className="gallery-grid">{gallery.map((item, index) => <article className="gallery-item glass reveal" key={item.id || index}>{item.image ? <button className="gallery-open" onClick={() => setSelectedPhoto(index)} aria-label={'Lihat foto: ' + (item.caption || 'Dokumentasi ' + (index + 1))}><img src={item.image} alt={item.caption || 'Dokumentasi kegiatan'} loading="lazy" /><span aria-hidden="true">↗</span></button> : <ImagePlaceholder number={String(index + 1).padStart(2, '0')} />}<div className="gallery-copy"><small>MOMENT / {String(index + 1).padStart(2, '0')}</small><h3>{item.caption || 'Sebuah momen'}</h3>{item.description && <p>{item.description}</p>}{!item.image && <p className="empty-caption">Dokumentasi akan ditambahkan.</p>}</div></article>)}</div>{gallery.length === 0 && <div className="glass empty-state"><span aria-hidden="true">▧</span><h3>Ruang untuk cerita berikutnya.</h3><p>Dokumentasi kegiatan akan hadir di sini.</p></div>}</section>

      <section id="sertifikat" className="section-tinted certificates-section"><div className="wrap"><div className="section-head reveal"><div><div className="eyebrow">04 / Little milestones</div><h2>Milestones<br /><em>unlocked.</em></h2></div><p>Sertifikat, pelatihan, dan jejak pembelajaran sepanjang perjalanan.</p></div>{certificates.length ? <div className="certificate-grid">{certificates.map((item, index) => <article className="glass certificate-card reveal" key={item.id || index}><div className="certificate-cover">{item.image ? <img src={item.image} alt={item.title || 'Sertifikat'} loading="lazy" /> : <div className="certificate-symbol" aria-hidden="true">✺</div>}<span className="chip">{item.document ? 'PDF / Sertifikat' : 'Sertifikat'}</span></div><div className="certificate-copy"><p className="certificate-meta">{[item.issuer, item.date].filter(Boolean).join(' · ')}</p><h3>{item.title || 'Sertifikat pembelajaran'}</h3>{item.description && <p>{item.description}</p>}<div className="certificate-links">{(item.document || item.image) && <a href={item.document || item.image} target="_blank" rel="noopener noreferrer">{item.document ? 'Buka PDF ↗' : 'Lihat sertifikat ↗'}</a>}{item.document && item.image && <a href={item.image} target="_blank" rel="noopener noreferrer">Lihat gambar ↗</a>}{item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer">Kredensial ↗</a>}</div></div></article>)}</div> : <div className="glass empty-state certificate-empty"><span aria-hidden="true">✺</span><div><h3>Perjalanan belajar masih berlanjut.</h3><p>Sertifikat dan dokumentasi pembelajaran akan ditampilkan di sini.</p></div></div>}</div></section>

      <section id="kontak" className="wrap"><div className="glass contact reveal"><div><div className="eyebrow">05 / Let's connect</div><h2>Setiap cerita baru<br />dimulai dari <em>halo.</em></h2><p>Untuk peluang kerja, kolaborasi, atau bertukar cerita.</p></div><div className="contact-actions">{email && <a className="email-link" href={email}>{data.email}</a>}{whatsapp && <a className="button primary" href={whatsapp} target="_blank" rel="noopener noreferrer">Mari berbincang <span aria-hidden="true">↗</span></a>}</div><span className="contact-flower" aria-hidden="true">✧</span></div></section>
    </main><footer className="wrap footer"><span>© {year} {data.name}</span><div><a href="#utama">Kembali ke atas ↑</a></div></footer>
    <dialog className="photo-dialog" ref={dialog} onCancel={() => setSelectedPhoto(null)} onClose={() => setSelectedPhoto(null)} onClick={event => { if (event.target === event.currentTarget) setSelectedPhoto(null); }} aria-label={photo?.caption || 'Detail foto'}>{photo && <div className="photo-dialog-content"><button className="dialog-close" onClick={() => setSelectedPhoto(null)} aria-label="Tutup foto">✕</button><img src={photo.image} alt={photo.caption || 'Dokumentasi kegiatan'} /><div><small>THE VISUAL DIARY</small><h3>{photo.caption}</h3>{photo.description && <p>{photo.description}</p>}</div></div>}</dialog>
  </div>;
}
