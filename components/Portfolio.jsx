'use client';

import { useEffect, useRef, useState } from 'react';
import useProfile from './useProfile';
import useGlassMotion from './useGlassMotion';
import { sectionAtViewport } from '../lib/navigation.mjs';
import { emailHref, whatsappHref } from '../lib/profile.mjs';

const sections = [
  ['utama', 'Profil'], ['tentang', 'Tentang'], ['pengalaman', 'Pengalaman'],
  ['galeri', 'Galeri'], ['sertifikat', 'Sertifikat'], ['kontak', 'Kontak'],
];

function SectionLabel({ number, children }) {
  return <p className="folio-kicker"><span>{number}</span>{children}</p>;
}

function CertificateRow({ item, index }) {
  return <article className="folio-certificate">
    <span className="folio-row-number">{String(index + 1).padStart(2, '0')}</span>
    {item.image && <a className="folio-certificate-image" href={item.image} target="_blank" rel="noopener noreferrer">
      <img src={item.image} alt={item.title || 'Sertifikat'} loading="lazy" />
    </a>}
    <div className="folio-certificate-copy">
      <h3>{item.title || 'Sertifikat'}</h3>
      <p className="folio-meta">{[item.issuer, item.date].filter(Boolean).join(' / ')}</p>
      {item.description && <p>{item.description}</p>}
    </div>
    <div className="folio-document-links">
      {item.document && <a href={item.document} target="_blank" rel="noopener noreferrer">Buka PDF ↗</a>}
      {item.image && <a href={item.image} target="_blank" rel="noopener noreferrer">Lihat gambar ↗</a>}
      {item.credentialUrl && <a href={item.credentialUrl} target="_blank" rel="noopener noreferrer">Kredensial ↗</a>}
    </div>
  </article>;
}

export default function Portfolio({ preview = false }) {
  const { data, replaceData } = useProfile({ livePreview: preview });
  const [activeSection, setActiveSection] = useState('utama');
  const [motion, setMotion] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [year, setYear] = useState(2026);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const dialog = useRef(null);
  const scope = useRef(null);
  const navigationIntent = useRef(null);
  useGlassMotion(scope, motionEnabled);

  useEffect(() => {
    try { setMotionEnabled(localStorage.getItem('sherlynda-motion') !== 'paused'); } catch { /* Motion remains optional without storage. */ }
  }, []);
  function toggleMotion() {
    setMotionEnabled(previous => {
      try { localStorage.setItem('sherlynda-motion', previous ? 'paused' : 'active'); } catch {}
      return !previous;
    });
  }

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
    scope.current.querySelectorAll('.folio-reveal').forEach(element => observer.observe(element));
    return () => observer.disconnect();
  }, [data]);

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
    navigationIntent.current = target.id;
    setActiveSection(target.id);
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  useEffect(() => {
    let frame;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (navigationIntent.current) return;
        const positions = sections.map(([id]) => ({ id, top: document.getElementById(id)?.getBoundingClientRect().top ?? Infinity }));
        setActiveSection(sectionAtViewport(positions, innerHeight));
      });
    };
    const finish = () => { navigationIntent.current = null; };
    const interrupt = () => { finish(); update(); };
    const keyInterrupt = event => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) interrupt();
    };
    update();
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    addEventListener('scrollend', finish);
    addEventListener('wheel', interrupt, { passive: true });
    addEventListener('touchstart', interrupt, { passive: true });
    addEventListener('keydown', keyInterrupt);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', update);
      removeEventListener('resize', update);
      removeEventListener('scrollend', finish);
      removeEventListener('wheel', interrupt);
      removeEventListener('touchstart', interrupt);
      removeEventListener('keydown', keyInterrupt);
    };
  }, []);


  const names = data.name.trim().split(/\s+/);
  const visibleGallery = gallery.map((item, index) => ({ ...item, sourceIndex: index })).filter(item => item.image);

  return <div ref={scope} onClick={navigateSection} className={'folio' + (motion ? ' motion' : '') + (!motionEnabled ? ' motion-paused' : '')}>
    <div className="folio-glass-scene" aria-hidden="true"><div className="folio-glass-depth"><i className="glass-cloud cloud-rose" /><i className="glass-cloud cloud-blush" /><i className="glass-cloud cloud-pearl" /><i className="glass-ribbon" /></div></div>
    <a className="folio-skip" href="#utama">Langsung ke konten</a>
    <header className="folio-header">
      <a className="folio-signature" href="#utama">{data.shortName}<span> / Portofolio</span></a>
      <div className="folio-header-actions"><button type="button" className="folio-motion-toggle" onClick={toggleMotion} aria-pressed={motionEnabled} aria-label={motionEnabled ? 'Jeda animasi' : 'Aktifkan animasi'}><span aria-hidden="true">{motionEnabled ? 'Ⅱ' : '▷'}</span><span>Gerakan</span></button><a className="folio-header-contact" href="#kontak">Hubungi saya <span aria-hidden="true">↗</span></a></div>
    </header>

    <aside className="folio-index">
      <span className="folio-index-label">Daftar isi</span>
      <nav aria-label="Navigasi utama">
        {sections.map(([id, label], index) => <a key={id} href={'#' + id}
          aria-current={activeSection === id ? 'location' : undefined}>
          <span className="folio-index-number">{String(index + 1).padStart(2, '0')}</span>
          <span>{label}</span>
        </a>)}
      </nav>
      <p className="folio-index-note">Pendidikan Sejarah<br />Catatan pengalaman<br />& dokumentasi.</p>
    </aside>

    <main className="folio-main">
      <section id="utama" className="folio-opening">
        <div className="folio-opening-meta"><span>Portofolio pribadi</span><span>Fresh graduate / {data.degree}</span></div>
        <div className="folio-name"><h1><span>{names[0]}</span>{names.length > 1 && <span>{names.slice(1).join(' ')}</span>}</h1></div>
        <figure className="folio-portrait" data-glass-tilt>
          {data.portrait
            ? <img src={data.portrait} alt={'Foto ' + data.name} fetchPriority="high" />
            : <div className="folio-portrait-empty"><span>{names[0][0]}</span><p>Foto profil akan ditambahkan.</p></div>}
          <figcaption><span>{data.name}</span><span>01 / Profil</span></figcaption><span className="folio-portrait-tag">{data.degree}</span>
        </figure>
        <div className="folio-introduction">
          <p>{data.intro}</p>
          <a className="folio-text-link" href="#pengalaman">Lihat pengalaman <span aria-hidden="true">↓</span></a>
        </div>
        {data.headline && <p className="folio-motto">{data.headline.split('\n').join(' / ')}</p>}
      </section>

      <section id="tentang" className="folio-about folio-section folio-reveal">
        <div className="folio-side-heading"><SectionLabel number="02">Tentang</SectionLabel><h2>Catatan<br />singkat.</h2></div>
        <div className="folio-about-body"><p className="folio-bio">{data.bio}</p>
          <dl className="folio-education">
            <div><dt>Pendidikan</dt><dd>{data.degree}</dd></div>
            <div><dt>Universitas</dt><dd>{data.university}</dd></div>
          </dl>
        </div>
      </section>

      <section id="pengalaman" className="folio-section folio-experience">
        <div className="folio-section-intro folio-reveal"><SectionLabel number="03">Pengalaman</SectionLabel><h2>Belajar di<br /><em>lapangan.</em></h2></div>
        <article className="folio-experience-story folio-reveal">
          <div className="folio-experience-meta"><span>Magang</span><span>{data.period || 'Kabupaten Malang'}</span></div>
          <h3>{data.company}</h3>
          <p className="folio-role">{data.role}</p>
          <p className="folio-story">{data.experience}</p>
          {data.experiencePhoto && <figure className="folio-field-photo"><img src={data.experiencePhoto} alt="Dokumentasi pengalaman magang" loading="lazy" /><figcaption>Dokumentasi magang / {data.company}</figcaption></figure>}
        </article>
        {data.organization.trim() && <article className="folio-organization folio-reveal"><SectionLabel number="—">Organisasi</SectionLabel><h3>{data.organization}</h3><p>{data.organizationDetail}</p></article>}
      </section>

      <section id="galeri" className="folio-section folio-gallery">
        <div className="folio-gallery-heading folio-reveal"><SectionLabel number="04">Galeri</SectionLabel><h2>Di antara<br /><em>kegiatan.</em></h2><p>Dokumentasi dan cerita dari pengalaman yang saya jalani.</p></div>
        {visibleGallery.length ? <div className="folio-photo-grid">
          {visibleGallery.map((item, index) => <figure className="folio-photo folio-reveal" data-glass-tilt key={item.id || item.sourceIndex} style={{ '--reveal-delay': (index % 3) * 90 + 'ms' }}>
            <button className="folio-photo-open" onClick={() => setSelectedPhoto(item.sourceIndex)} aria-label={'Lihat foto: ' + (item.caption || 'Dokumentasi ' + (index + 1))}>
              <img src={item.image} alt={item.caption || 'Dokumentasi kegiatan'} loading="lazy" />
              <span aria-hidden="true">Lihat foto ↗</span>
            </button>
            <figcaption><span className="folio-photo-number">{String(index + 1).padStart(2, '0')}</span><div><h3>{item.caption || 'Dokumentasi kegiatan'}</h3>{item.description && <p>{item.description}</p>}</div></figcaption>
          </figure>)}
        </div> : <p className="folio-empty">Dokumentasi kegiatan akan ditambahkan di sini.</p>}
      </section>

      <section id="sertifikat" className="folio-section folio-certificates">
        <div className="folio-archive-heading folio-reveal"><div><SectionLabel number="05">Sertifikat</SectionLabel><h2>Arsip<br /><em>pembelajaran.</em></h2></div><p>Sertifikat, pelatihan, dan pencapaian.</p></div>
        {certificates.length ? <div className="folio-certificate-list">{certificates.map((item, index) => <CertificateRow key={item.id || index} item={item} index={index} />)}</div>
          : <p className="folio-empty">Sertifikat akan ditambahkan di sini.</p>}
      </section>

      <section id="kontak" className="folio-section folio-contact folio-reveal">
        <SectionLabel number="06">Kontak</SectionLabel>
        <h2>Mari<br /><em>berbincang.</em></h2>
        <div className="folio-contact-details"><p>Untuk peluang kerja, kolaborasi,<br />atau percakapan baru.</p><div>
          {email && <a className="folio-email" href={email}>{data.email}<span aria-hidden="true">↗</span></a>}
          {whatsapp && <a className="folio-text-link" href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp <span aria-hidden="true">↗</span></a>}
        </div></div>
      </section>
      <footer className="folio-footer"><span>© {year} {data.name}</span><a href="#utama">Kembali ke atas ↑</a></footer>
    </main>

    <dialog className="folio-modal" ref={dialog} onCancel={() => setSelectedPhoto(null)} onClose={() => setSelectedPhoto(null)}
      onClick={event => { if (event.target === event.currentTarget) setSelectedPhoto(null); }} aria-label={photo?.caption || 'Detail foto'}>
      {photo && <div className="folio-modal-body"><button className="folio-modal-close" onClick={() => setSelectedPhoto(null)} aria-label="Tutup foto">Tutup ×</button>
        <img src={photo.image} alt={photo.caption || 'Dokumentasi kegiatan'} />
        <div><h3>{photo.caption}</h3>{photo.description && <p>{photo.description}</p>}</div>
      </div>}
    </dialog>
  </div>;
}

