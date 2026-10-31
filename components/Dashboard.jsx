'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import useProfile from './useProfile';
import { compressPhoto } from '../lib/photos.mjs';

const tabs = [['overview', '◉', 'Ringkasan'], ['profile', '↗', 'Profil & pendidikan'], ['experience', '▤', 'Pengalaman'], ['photos', '▧', 'Foto & galeri'], ['contact', '✉', 'Kontak']];
const fields = {
  profile: [['name', 'Nama lengkap'], ['shortName', 'Nama panggilan'], ['headline', 'Judul utama (satu baris per kata/kalimat)', 'textarea'], ['intro', 'Perkenalan singkat', 'textarea'], ['bio', 'Tentang saya', 'textarea'], ['degree', 'Jurusan'], ['university', 'Kampus']],
  experience: [['company', 'Tempat magang'], ['role', 'Posisi / tanggung jawab'], ['period', 'Periode (opsional)'], ['experience', 'Cerita magang & kontribusi', 'textarea'], ['organization', 'Nama organisasi (opsional)'], ['organizationDetail', 'Jabatan, kegiatan, dan kontribusi organisasi', 'textarea']],
  contact: [['email', 'Email', 'email'], ['phone', 'Nomor WhatsApp', 'tel']],
};
const descriptions = {
  profile: ['Kenalkan dirimu.', 'Biar pengunjung mengenal orang di balik portofolio ini.'],
  experience: ['Pengalaman yang membentukmu.', 'Bagian organisasi muncul setelah namanya diisi.'],
  contact: ['Buka pintu percakapan.', 'Kontak ini akan tampil di portofolio. Nomor 08 otomatis disesuaikan untuk tautan WhatsApp.'],
};

function download(data, filename) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export default function Dashboard() {
  const { data, setData, replaceData, status } = useProfile({ persist: true });
  const [tab, setTab] = useState('overview');
  const [mobile, setMobile] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(null);
  const [frameReady, setFrameReady] = useState(false);
  const frame = useRef(null);
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH || '';

  useEffect(() => {
    function receive(event) {
      if (event.source === frame.current?.contentWindow && event.origin === location.origin && event.data?.type === 'portfolio-ready') setFrameReady(true);
    }
    addEventListener('message', receive);
    return () => removeEventListener('message', receive);
  }, []);

  useEffect(() => {
    if (!frameReady) return;
    frame.current?.contentWindow?.postMessage({ type: 'portfolio-preview', data }, location.origin);
  }, [data, frameReady]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  function update(key, value) { setData(previous => ({ ...previous, [key]: value })); }
  function updateGallery(index, key, value) {
    setData(previous => ({ ...previous, gallery: previous.gallery.map((item, i) => i === index ? { ...item, [key]: value } : item) }));
  }
  async function upload(event, key, index) {
    const file = event.target.files[0];
    if (!file) return;
    const input = event.target;
    setUploading(key);
    try {
      const image = await compressPhoto(file);
      if (index >= 0) updateGallery(index, 'image', image); else update(key, image);
      setMessage('Foto ditambahkan ke draf.');
    } catch (error) { setMessage(error.message); }
    finally { input.value = ''; setUploading(null); }
  }
  async function restore(event) {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 8000000) throw new Error('Backup maksimal 8 MB.');
      const raw = JSON.parse(await file.text());
      if (typeof raw.name !== 'string' || !Array.isArray(raw.gallery)) throw new Error('Format backup tidak dikenali.');
      replaceData(raw);
      setMessage('Backup berhasil dipulihkan.');
    } catch (error) { setMessage('Tidak dapat mengimpor: ' + error.message); }
    event.target.value = '';
  }
  const photoSlots = [['portrait', 'Foto profil', -1], ['experiencePhoto', 'Dokumentasi magang', -1], ...data.gallery.map((_, i) => ['gallery' + i, 'Jurnal visual 0' + (i + 1), i])];

  return <div className="admin"><div className="admin-shell">
    <aside className="sidebar"><Link className="brand" href="/">studio<span>.</span></Link><small>SHERLYNDA / PORTFOLIO</small>
      {tabs.map(([key, icon, label]) => <button key={key} type="button" className={'tab' + (tab === key ? ' active' : '')} onClick={() => setTab(key)} aria-pressed={tab === key}>{icon} &nbsp; {label}</button>)}
      <div className="sidebar-bottom"><p>Sebuah ruang kecil untuk<br />merawat cerita besarmu.</p><Link className="btn" href="/">← Lihat portofolio</Link></div>
    </aside>
    <main className="admin-main"><div className="admin-header"><div><div className="dashboard-heading">Your personal creative space</div><h1>Portfolio studio<span style={{ color: 'var(--orange)' }}>.</span></h1><p>Ubah ceritamu. Lihat hasilnya langsung.</p></div>
      <div className="admin-actions"><span className="save-state" role="status">{status}</span><button className="btn" onClick={() => { download(data, 'sherlynda-backup.json'); setMessage('Backup data diunduh.'); }}>Backup data ↓</button><button className="btn primary" onClick={() => { download(data, 'portfolio.json'); setMessage('Data publikasi diunduh. Ganti data/portfolio.json di GitHub, lalu commit untuk deploy ulang.'); }}>Ekspor perubahan ↗</button></div>
    </div>
    <div className="admin-layout"><div>
      {tab === 'overview' && <section className="editor-card"><div className="summary"><h3>Halo, {data.shortName} ☀</h3><p>Portofoliomu adalah cerita yang terus tumbuh. Mulai dari yang sudah kamu punya.</p></div><h2>Semua cerita, satu tempat.</h2><p className="help">Edit teks, lengkapi pengalaman, dan masukkan dokumentasi melalui menu studio.</p><div className="storage-note"><strong>Draf pribadi di browser ini.</strong><br />Draf tersimpan di perangkat ini dan langsung muncul di preview. Untuk menayangkannya bagi semua pengunjung: klik <strong>Ekspor perubahan</strong>, ganti file <code>data/portfolio.json</code> di GitHub, lalu commit. GitHub Actions akan membangun dan menerbitkan ulang website setelah Pages diaktifkan.</div><label className="field">Pulihkan backup JSON<input type="file" accept="application/json,.json" onChange={restore} /></label><p className="admin-tip">Editor lokal tanpa akun. Perubahan tidak otomatis tersinkron ke perangkat lain. GitHub Pages tidak menyediakan server untuk menyimpan perubahan dari dashboard; pengunjung tidak dapat mengubah file di repositori melalui editor ini.</p></section>}
      {fields[tab] && <form className="editor-card" onSubmit={event => event.preventDefault()}><h2>{descriptions[tab][0]}</h2><p className="help">{descriptions[tab][1]}</p>{fields[tab].map(([key, label, type]) => <label className="field" key={key}>{label}{type === 'textarea' ? <textarea name={key} value={data[key]} rows={key === 'headline' ? 3 : 5} maxLength={4000} onChange={event => update(key, event.target.value)} /> : <input name={key} type={type || 'text'} value={data[key]} maxLength={250} onChange={event => update(key, event.target.value)} />}</label>)}</form>}
      {tab === 'photos' && <section className="editor-card"><h2>Tambahkan sisi visualnya.</h2><p className="help">JPG, PNG, WebP; maksimal 10 MB per foto. Gambar diperkecil hingga sisi terpanjang 1200 piksel.</p>{photoSlots.map(([key, label, index]) => {
        const src = index >= 0 ? data.gallery[index].image : data[key];
        return <div className="upload-card" key={key}><h3>{label}</h3>{src && <img className="upload-thumb" src={src} alt={label} />}<label className="field">Pilih gambar untuk {label.toLowerCase()}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading !== null} onChange={event => upload(event, key, index)} /></label>{uploading === key && <p className="help">Memproses foto…</p>}{index >= 0 && <label className="field">Keterangan foto<input value={data.gallery[index].caption} maxLength={160} onChange={event => updateGallery(index, 'caption', event.target.value)} /></label>}{src && <button className="btn" type="button" style={{ marginTop: 12 }} onClick={() => index >= 0 ? updateGallery(index, 'image', '') : update(key, '')}>Hapus foto</button>}</div>;
      })}</section>}
    </div>
    <div className="preview-panel"><div className="preview-toolbar"><span>Live preview</span><div><button className="btn" aria-pressed={!mobile} onClick={() => setMobile(false)}>Lebar</button> <button className="btn" aria-pressed={mobile} onClick={() => setMobile(true)}>Ponsel</button></div></div><div className={'preview-shell' + (mobile ? ' mobile' : '')}><iframe ref={frame} title="Preview langsung portofolio" src={prefix + '/preview/'} onLoad={() => setFrameReady(true)} /></div><p className="help" style={{ marginTop: 12 }}>Scroll di dalam bingkai untuk menjelajahi halaman.</p></div>
    </div></main>
  </div>{message && <div className="toast" role="status">{message}</div>}</div>;
}
