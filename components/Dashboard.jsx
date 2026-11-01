'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import useProfile from './useProfile';
import { EXPERIENCE_LOGOS, experienceLogo } from '../lib/experience-logos.mjs';
import { RECOVERY_KEY } from '../lib/draft-state.mjs';
import { mediaPatch, updateCertificateMedia } from '../lib/media-state.mjs';
import { compressPhoto } from '../lib/photos.mjs';
import { uploadMedia, publishProfile, listUploadedMedia } from '../lib/content-client';

const tabs = [['overview', '◉', 'Ringkasan'], ['profile', '↗', 'Profil & pendidikan'], ['experience', '▤', 'Pengalaman'], ['gallery', '▧', 'Galeri foto'], ['certificates', '✺', 'Sertifikat'], ['contact', '✉', 'Kontak'], ['media', '▧', 'File tersimpan']];
const fields = {
  profile: [['name', 'Nama lengkap'], ['shortName', 'Nama panggilan'], ['headline', 'Judul utama (satu baris per kata/kalimat)', 'textarea'], ['intro', 'Perkenalan singkat', 'textarea'], ['bio', 'Tentang saya', 'textarea'], ['degree', 'Jurusan'], ['university', 'Kampus']],
  experience: [['company', 'Tempat magang'], ['role', 'Posisi / tanggung jawab'], ['period', 'Periode (opsional)'], ['experience', 'Cerita magang & kontribusi', 'textarea'], ['organization', 'Nama organisasi (opsional)'], ['organizationDetail', 'Jabatan, kegiatan, dan kontribusi organisasi', 'textarea']],
  contact: [['email', 'Email', 'email'], ['phone', 'Nomor WhatsApp', 'tel']],
};
const descriptions = { profile: ['Kenalkan dirimu.', 'Cerita singkat tentang orang di balik portofolio ini.'], experience: ['Pengalaman yang membentukmu.', 'Tambahkan cerita magang dan organisasi.'], contact: ['Buka pintu percakapan.', 'Kontak ini akan tampil di portofolio publik.'] };

function download(data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2) + '\n'], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'sherlynda-backup.json'; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function Field({ label, value, onChange, type = 'text', maxLength = 4000 }) {
  return <label className="field">{label}{type === 'textarea' ? <textarea rows={4} maxLength={maxLength} value={value || ''} onChange={event => onChange(event.target.value)} /> : <input type={type} maxLength={maxLength} value={value || ''} onChange={event => onChange(event.target.value)} />}</label>;
}

function LogoEditor({ data, logo, onChange, onUpload, prefix }) {
  const src = experienceLogo({ ...data, [logo.visible]: true }, logo, prefix);
  return <div className="logo-editor"><h3>{logo.label}</h3>{src && <img className={'logo-editor-preview' + (logo.key === 'programLogo' && !data.programLogo ? ' msib-default' : '')} src={src} alt={logo.caption} />}<label className="logo-visibility"><input type="checkbox" checked={data[logo.visible] !== false} onChange={event => onChange(logo.visible, event.target.checked)} />Tampilkan di pengalaman magang</label><label className="field">Ganti logo<input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => onUpload(event, logo.key)} /></label><p className="help">PNG transparan, JPG, atau WebP · Maksimal 10 MB. Logo disimpan tanpa mengubah warna atau transparansi.</p>{data[logo.key] && <button type="button" className="btn" onClick={() => onChange(logo.key, '')}>Gunakan logo bawaan</button>}</div>;
}

export default function Dashboard({ onSignOut }) {
  const { data, setData, replaceData, acceptPublished, version, status, loaded } = useProfile({ persist: true });
  const [tab, setTab] = useState('overview');
  const [storedMedia, setStoredMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishedSnapshot, setPublished] = useState(null);
  const published = publishedSnapshot === JSON.stringify(data);
  const [frameReady, setFrameReady] = useState(false);
  const frame = useRef(null);
  const prefix = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const gallery = data.gallery || [];
  const certificates = data.certificates || [];

  useEffect(() => {
    const receive = event => { if (event.source === frame.current?.contentWindow && event.origin === location.origin && event.data?.type === 'portfolio-ready') setFrameReady(true); };
    addEventListener('message', receive); return () => removeEventListener('message', receive);
  }, []);
  useEffect(() => { if (frameReady) frame.current?.contentWindow?.postMessage({ type: 'portfolio-preview', data }, location.origin); }, [data, frameReady]);
  useEffect(() => { if (!message) return; const timeout = setTimeout(() => setMessage(''), 8000); return () => clearTimeout(timeout); }, [message]);


  function update(key, value) { setPublished(false); setData(previous => ({ ...previous, [key]: value })); }
  function updateItem(collection, index, key, value) { setData(previous => ({ ...previous, [collection]: (previous[collection] || []).map((item, i) => i === index ? { ...item, [key]: value } : item) })); }
  function removeItem(collection, index) { setData(previous => ({ ...previous, [collection]: previous[collection].filter((_, i) => i !== index) })); }
  function moveItem(collection, index, direction) { setData(previous => { const items = [...previous[collection]]; const target = index + direction; if (target < 0 || target >= items.length) return previous; [items[index], items[target]] = [items[target], items[index]]; return { ...previous, [collection]: items }; }); }
  function addCertificate() { if (certificates.length >= 100) return; setData(previous => ({ ...previous, certificates: [...(previous.certificates || []), { id: crypto.randomUUID(), title: '', issuer: '', date: '', description: '', image: '', document: '', credentialUrl: '' }] })); }

  async function uploadFile(file, allowPdf = false) {
    if (allowPdf && file.type === 'application/pdf') return mediaPatch(await uploadMedia(file), true);
    const encoded = await compressPhoto(file);
    const blob = await (await fetch(encoded)).blob();
    return mediaPatch(await uploadMedia(blob));
  }
  async function uploadSingle(event, target, certificateId = null) {
    const input = event.target, file = input.files[0]; if (!file) return;
    setUploading('Mengunggah file…');
    try { const isLogo = EXPERIENCE_LOGOS.some(logo => logo.key === target); if (isLogo && !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Logo harus PNG, JPG, atau WebP.'); const result = isLogo ? { image: await uploadMedia(file) } : await uploadFile(file, target === 'certificates'); if (target === 'certificates') { setData(previous => updateCertificateMedia(previous, certificateId, result)); } else update(target, result.image); setMessage('File ditambahkan. Klik Publikasikan untuk menampilkannya di website.'); }
    catch (error) { setMessage(error.message); }
    finally { input.value = ''; setUploading(''); }
  }
  async function uploadGallery(event) {
    const input = event.target, files = [...input.files]; if (!files.length) return;
    if (gallery.length + files.length > 100) { setMessage('Galeri dapat memuat hingga 100 foto. Kurangi pilihan atau hapus foto yang tidak dipakai.'); input.value = ''; return; }
    let count = 0;
    try { for (const file of files) { setUploading('Mengunggah foto ' + (count + 1) + ' dari ' + files.length + '…'); const result = await uploadFile(file); setData(previous => ({ ...previous, gallery: [...previous.gallery, { id: crypto.randomUUID(), caption: file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '), description: '', image: result.image }] })); count++; } setMessage(count + ' foto ditambahkan ke draf. Lengkapi judul dan deskripsinya.'); }
    catch (error) { setMessage((count ? count + ' foto sudah ditambahkan. ' : '') + error.message); }
    finally { input.value = ''; setUploading(''); }
  }
  async function publish() {
    if (publishing || uploading || !loaded) return;
    setPublishing(true);
    try { const result = await publishProfile(data, version.current); acceptPublished(result); setPublished(JSON.stringify(result.data)); setMessage('Portofolio berhasil dipublikasikan. Pengunjung sekarang dapat melihat perubahanmu.'); }
    catch (error) { setMessage(error.message); }
    finally { setPublishing(false); }
  }
  async function refreshMedia() {
    setMediaLoading(true);
    try { setStoredMedia(await listUploadedMedia()); } catch (error) { setMessage(error.message); }
    finally { setMediaLoading(false); }
  }
  function reuseMedia(file, target) {
    setPublished(false);
    setData(previous => {
      if (target === 'portrait') return { ...previous, portrait: file.url };
      if (target === 'gallery') {
        if (previous.gallery.length >= 100) return previous;
        return { ...previous, gallery: [...previous.gallery, { id: crypto.randomUUID(), image: file.url, caption: '', description: '' }] };
      }
      if (previous.certificates.length >= 100) return previous;
      return { ...previous, certificates: [...previous.certificates, { id: crypto.randomUUID(), title: '', issuer: '', date: '', description: '', image: file.pdf ? '' : file.url, document: file.pdf ? file.url : '', credentialUrl: '' }] };
    });
    setMessage('File dipasang ke draf. Lengkapi keterangannya lalu klik Publikasikan.');
  }
  async function restore(event) {
    const input = event.target, file = input.files[0]; if (!file) return;
    try { if (file.size > 20000000) throw new Error('Backup maksimal 20 MB.'); const raw = JSON.parse(await file.text()); if (typeof raw.name !== 'string' || !Array.isArray(raw.gallery)) throw new Error('Format backup tidak dikenali.'); replaceData(raw); setMessage('Backup dipulihkan ke draf. Periksa preview lalu publikasikan jika sudah sesuai.'); }
    catch (error) { setMessage(error.message); } finally { input.value = ''; }
  }

  return <div className="admin"><div className="admin-shell"><aside className="sidebar"><Link className="brand" href="/">studio<span>.</span></Link><small>SHERLYNDA / YOUR CREATIVE SPACE</small>{tabs.map(([key, icon, label]) => <button key={key} type="button" className={'tab' + (tab === key ? ' active' : '')} onClick={() => setTab(key)} aria-pressed={tab === key}><span aria-hidden="true">{icon}</span>{label}</button>)}<div className="sidebar-bottom"><Link className="btn" href="/" target="_blank">Lihat portofolio ↗</Link>{onSignOut && <button className="btn logout-button" onClick={onSignOut}>Keluar dari studio</button>}</div></aside>
    <main className="admin-main"><header className="admin-header"><div><div className="dashboard-heading">A little room for your big story</div><h1>Portfolio studio<span>.</span></h1><p>Tambah cerita. Simpan momen. Rayakan prosesnya.</p></div><div className="admin-actions"><button className="btn" onClick={() => download(data)}>Backup ↓</button><button className="btn" onClick={() => { const saved = localStorage.getItem(RECOVERY_KEY); if (saved) download(JSON.parse(saved)); else setMessage('Belum ada draf sebelumnya untuk dipulihkan.'); }}>Backup draf sebelumnya ↓</button><button className="btn primary" onClick={publish} disabled={!loaded || publishing || !!uploading}>{publishing ? 'Menerbitkan…' : 'Publikasikan ↗'}</button></div></header><div className="studio-status" role="status"><span className="status-dot" />{uploading || (published ? '✓ Portofolio dipublikasikan' : status)}<span>Perubahan draf tampil di website setelah dipublikasikan.</span></div>
    <div className="admin-layout"><fieldset className="editor-fieldset" disabled={publishing || !!uploading || !loaded}>
      {tab === 'media' && <section className="editor-card"><h2>File tersimpan.</h2><p className="help">Unggahan tetap ada di sini meskipun terlepas dari draf. Muat hingga 100 file terbaru lalu pilih tempat untuk memasangnya kembali.</p><button className="btn" disabled={mediaLoading} onClick={refreshMedia}>{mediaLoading ? 'Memuat…' : 'Muat / perbarui daftar file'}</button>{storedMedia.map(file => <article className="media-editor" key={file.url}>{!file.pdf && <img className="media-editor-image" src={file.url} alt="Unggahan tersimpan" loading="lazy" />}<p className="help">{file.pdf ? 'Dokumen PDF' : 'Gambar'} · {file.name.slice(0, 12)}…</p><div className="item-actions"><a className="btn" href={file.url} target="_blank" rel="noopener noreferrer">Lihat file ↗</a>{!file.pdf && <><button className="btn" onClick={() => reuseMedia(file, 'portrait')}>Jadikan foto profil</button><button className="btn" disabled={gallery.length >= 100} onClick={() => reuseMedia(file, 'gallery')}>Tambah ke galeri</button></>}<button className="btn" disabled={certificates.length >= 100} onClick={() => reuseMedia(file, 'certificates')}>Tambah sebagai sertifikat</button></div></article>)}</section>}
      {tab === 'overview' && <section className="editor-card"><div className="summary"><span className="eyebrow">WELCOME BACK</span><h2>Halo, {data.shortName} <span aria-hidden="true">✧</span></h2><p>Perjalananmu terus bertumbuh.<br />Ada cerita baru yang ingin dibagikan?</p></div><div className="studio-stats"><button onClick={() => setTab('gallery')}><strong>{gallery.filter(item => item.image).length}</strong><span>Foto galeri ↗</span></button><button onClick={() => setTab('certificates')}><strong>{certificates.length}</strong><span>Sertifikat ↗</span></button></div><h3>Mulai dari yang kamu punya.</h3><p className="help">Edit profil, unggah beberapa foto sekaligus, tambahkan deskripsi, atau simpan sertifikat pembelajaranmu.</p><div className="storage-note">Draf disimpan otomatis di browser. Klik <strong>Publikasikan</strong> untuk menyimpan versi online yang dapat dilihat pengunjung dan dibuka dari perangkat lain.</div><label className="field">Pulihkan backup JSON<input type="file" accept="application/json,.json" onChange={restore} /></label></section>}
      {fields[tab] && <section className="editor-card"><h2>{descriptions[tab][0]}</h2><p className="help">{descriptions[tab][1]}</p>{fields[tab].map(([key, label, type]) => <Field key={key} label={label} type={type} value={data[key]} onChange={value => update(key, value)} maxLength={type === 'textarea' ? 4000 : 250} />)}{tab === 'experience' && <div className="experience-logo-editors"><h3>Logo pengalaman magang</h3><p className="help">Logo RBA dan Magang Merdeka sudah disediakan. Ganti atau sembunyikan secara terpisah, lalu klik Publikasikan.</p>{EXPERIENCE_LOGOS.map(logo => <LogoEditor key={logo.key} data={data} logo={logo} onChange={update} onUpload={uploadSingle} prefix={prefix} />)}</div>}{['profile', 'experience'].includes(tab) && <div className="upload-card"><h3>{tab === 'profile' ? 'Foto profil' : 'Dokumentasi magang'}</h3>{data[tab === 'profile' ? 'portrait' : 'experiencePhoto'] && <img className="upload-thumb" src={data[tab === 'profile' ? 'portrait' : 'experiencePhoto']} alt="Foto terpilih" />}<label className="field">Unggah gambar<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => uploadSingle(event, tab === 'profile' ? 'portrait' : 'experiencePhoto')} /></label>{data[tab === 'profile' ? 'portrait' : 'experiencePhoto'] && <button className="btn danger" onClick={() => update(tab === 'profile' ? 'portrait' : 'experiencePhoto', '')}>Hapus foto</button>}</div>}</section>}
      {tab === 'gallery' && <section className="editor-card"><div className="editor-heading"><div><h2>Potongan perjalananmu.</h2><p className="help">Pilih banyak foto sekaligus, lalu ceritakan setiap momennya.</p></div><span className="count-chip">{gallery.length} / 100</span></div><label className="upload-drop">↥ <strong>Tambah foto ke galeri</strong><span>JPG, PNG, WebP · Maksimal 10 MB per foto</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={uploadGallery} /></label><p className="help">Foto yang dipublikasikan dapat dilihat pengunjung.</p>{gallery.map((item, index) => <article className="media-editor" key={item.id || index}><div className="media-editor-top"><span>FOTO {String(index + 1).padStart(2, '0')}</span><div className="item-actions"><button className="btn" aria-label={'Naikkan foto ' + (index + 1)} disabled={index === 0} onClick={() => moveItem('gallery', index, -1)}>↑</button><button className="btn" aria-label={'Turunkan foto ' + (index + 1)} disabled={index === gallery.length - 1} onClick={() => moveItem('gallery', index, 1)}>↓</button><button className="btn danger" onClick={() => removeItem('gallery', index)}>Hapus</button></div></div>{item.image ? <img className="media-editor-image" src={item.image} alt={item.caption || 'Foto galeri'} /> : <div className="media-empty">Belum ada gambar</div>}<Field label="Judul / keterangan foto" value={item.caption} onChange={value => updateItem('gallery', index, 'caption', value)} maxLength={160} /><Field label="Deskripsi / cerita di balik foto" value={item.description} type="textarea" onChange={value => updateItem('gallery', index, 'description', value)} /></article>)}{!gallery.length && <p className="empty-editor">Belum ada foto. Unggah momen pertamamu di atas.</p>}</section>}
      {tab === 'certificates' && <section className="editor-card"><div className="editor-heading"><div><h2>Setiap langkah berarti.</h2><p className="help">Sertifikat, pelatihan, penghargaan, dan pencapaian lainnya.</p></div><span className="count-chip">{certificates.length} / 100</span></div><button className="btn primary" onClick={addCertificate} disabled={certificates.length >= 100}>＋ Tambah sertifikat</button><p className="help" style={{ marginTop: 14 }}>Setiap kartu adalah satu sertifikat. Klik Tambah sertifikat untuk dokumen berbeda. Gambar sampul dan PDF pada kartu yang sama disimpan bersama; mengganti salah satunya tidak menghapus yang lain.</p>{certificates.map((item, index) => <article className="media-editor" key={item.id || index}><div className="media-editor-top"><span>SERTIFIKAT {String(index + 1).padStart(2, '0')}</span><div className="item-actions"><button className="btn" aria-label={'Naikkan sertifikat ' + (index + 1)} disabled={index === 0} onClick={() => moveItem('certificates', index, -1)}>↑</button><button className="btn" aria-label={'Turunkan sertifikat ' + (index + 1)} disabled={index === certificates.length - 1} onClick={() => moveItem('certificates', index, 1)}>↓</button><button className="btn danger" onClick={() => removeItem('certificates', index)}>Hapus</button></div></div>{item.image && <img className="media-editor-image certificate-thumbnail" src={item.image} alt={item.title || 'Sertifikat'} />}{item.document && <a className="document-link" href={item.document} target="_blank" rel="noopener noreferrer">▤ Lihat PDF yang diunggah ↗</a>}<label className="field">Tambah / ganti gambar sampul atau PDF<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => uploadSingle(event, 'certificates', item.id)} /></label><Field label="Judul sertifikat / pelatihan" value={item.title} onChange={value => updateItem('certificates', index, 'title', value)} maxLength={200} /><Field label="Penerbit / penyelenggara" value={item.issuer} onChange={value => updateItem('certificates', index, 'issuer', value)} maxLength={200} /><Field label="Tanggal / tahun" value={item.date} onChange={value => updateItem('certificates', index, 'date', value)} maxLength={40} /><Field label="Deskripsi" value={item.description} type="textarea" onChange={value => updateItem('certificates', index, 'description', value)} /><Field label="Tautan kredensial (https://, opsional)" value={item.credentialUrl} type="url" onChange={value => updateItem('certificates', index, 'credentialUrl', value)} maxLength={2048} /></article>)}{!certificates.length && <p className="empty-editor">Belum ada sertifikat. Tambahkan kapan pun kamu siap.</p>}</section>}
    </fieldset><aside className="preview-panel"><div className="preview-toolbar"><span><i className="status-dot" />Live preview</span><div><button className="btn" aria-pressed={!mobile} onClick={() => setMobile(false)}>Lebar</button><button className="btn" aria-pressed={mobile} onClick={() => setMobile(true)}>Ponsel</button></div></div><div className={'preview-shell' + (mobile ? ' mobile' : '')}><iframe ref={frame} title="Preview langsung portofolio" src={prefix + '/preview/'} onLoad={() => setFrameReady(true)} /></div><p className="help">Preview menampilkan draf. Klik Publikasikan jika sudah sesuai.</p></aside></div></main>
  </div>{message && <div className="toast" role="status">{message}</div>}</div>;
}

