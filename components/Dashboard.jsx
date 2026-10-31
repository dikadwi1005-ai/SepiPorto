'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import useProfile from './useProfile';
import { compressPhoto } from '../lib/photos.mjs';
import { uploadMedia, publishProfile } from '../lib/content-client';

const tabs = [['overview', '◉', 'Ringkasan'], ['profile', '↗', 'Profil & pendidikan'], ['experience', '▤', 'Pengalaman'], ['gallery', '▧', 'Galeri foto'], ['certificates', '✺', 'Sertifikat'], ['contact', '✉', 'Kontak']];
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

export default function Dashboard({ onSignOut }) {
  const { data, setData, replaceData, status, loaded } = useProfile({ persist: true });
  const [tab, setTab] = useState('overview');
  const [mobile, setMobile] = useState(false);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
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
  useEffect(() => { setPublished(false); }, [data]);

  function update(key, value) { setData(previous => ({ ...previous, [key]: value })); }
  function updateItem(collection, index, key, value) { setData(previous => ({ ...previous, [collection]: (previous[collection] || []).map((item, i) => i === index ? { ...item, [key]: value } : item) })); }
  function removeItem(collection, index) { setData(previous => ({ ...previous, [collection]: previous[collection].filter((_, i) => i !== index) })); }
  function moveItem(collection, index, direction) { setData(previous => { const items = [...previous[collection]]; const target = index + direction; if (target < 0 || target >= items.length) return previous; [items[index], items[target]] = [items[target], items[index]]; return { ...previous, [collection]: items }; }); }
  function addCertificate() { if (certificates.length >= 100) return; setData(previous => ({ ...previous, certificates: [...(previous.certificates || []), { id: crypto.randomUUID(), title: '', issuer: '', date: '', description: '', image: '', document: '', credentialUrl: '' }] })); }

  async function uploadFile(file, allowPdf = false) {
    if (allowPdf && file.type === 'application/pdf') return { document: await uploadMedia(file), image: '' };
    const encoded = await compressPhoto(file);
    const blob = await (await fetch(encoded)).blob();
    return { image: await uploadMedia(blob), document: '' };
  }
  async function uploadSingle(event, target, index = -1) {
    const input = event.target, file = input.files[0]; if (!file) return;
    setUploading('Mengunggah file…');
    try { const result = await uploadFile(file, target === 'certificates'); if (target === 'certificates') { setData(previous => ({ ...previous, certificates: previous.certificates.map((item, i) => i === index ? { ...item, ...result } : item) })); } else update(target, result.image); setMessage('File ditambahkan. Klik Publikasikan untuk menampilkannya di website.'); }
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
    try { const result = await publishProfile(data); replaceData(result); setPublished(true); setMessage('Portofolio berhasil dipublikasikan. Pengunjung sekarang dapat melihat perubahanmu.'); }
    catch (error) { setMessage(error.message); }
    finally { setPublishing(false); }
  }
  async function restore(event) {
    const input = event.target, file = input.files[0]; if (!file) return;
    try { if (file.size > 20000000) throw new Error('Backup maksimal 20 MB.'); const raw = JSON.parse(await file.text()); if (typeof raw.name !== 'string' || !Array.isArray(raw.gallery)) throw new Error('Format backup tidak dikenali.'); replaceData(raw); setMessage('Backup dipulihkan ke draf. Periksa preview lalu publikasikan jika sudah sesuai.'); }
    catch (error) { setMessage(error.message); } finally { input.value = ''; }
  }

  return <div className="admin"><div className="admin-shell"><aside className="sidebar"><Link className="brand" href="/">studio<span>.</span></Link><small>SHERLYNDA / YOUR CREATIVE SPACE</small>{tabs.map(([key, icon, label]) => <button key={key} type="button" className={'tab' + (tab === key ? ' active' : '')} onClick={() => setTab(key)} aria-pressed={tab === key}><span aria-hidden="true">{icon}</span>{label}</button>)}<div className="sidebar-bottom"><Link className="btn" href="/" target="_blank">Lihat portofolio ↗</Link>{onSignOut && <button className="btn logout-button" onClick={onSignOut}>Keluar dari studio</button>}</div></aside>
    <main className="admin-main"><header className="admin-header"><div><div className="dashboard-heading">A little room for your big story</div><h1>Portfolio studio<span>.</span></h1><p>Tambah cerita. Simpan momen. Rayakan prosesnya.</p></div><div className="admin-actions"><button className="btn" onClick={() => download(data)}>Backup ↓</button><button className="btn primary" onClick={publish} disabled={!loaded || publishing || !!uploading}>{publishing ? 'Menerbitkan…' : 'Publikasikan ↗'}</button></div></header><div className="studio-status" role="status"><span className="status-dot" />{uploading || (published ? '✓ Portofolio dipublikasikan' : status)}<span>Perubahan draf tampil di website setelah dipublikasikan.</span></div>
    <div className="admin-layout"><fieldset className="editor-fieldset" disabled={publishing || !!uploading || !loaded}>
      {tab === 'overview' && <section className="editor-card"><div className="summary"><span className="eyebrow">WELCOME BACK</span><h2>Halo, {data.shortName} <span aria-hidden="true">✧</span></h2><p>Perjalananmu terus bertumbuh.<br />Ada cerita baru yang ingin dibagikan?</p></div><div className="studio-stats"><button onClick={() => setTab('gallery')}><strong>{gallery.filter(item => item.image).length}</strong><span>Foto galeri ↗</span></button><button onClick={() => setTab('certificates')}><strong>{certificates.length}</strong><span>Sertifikat ↗</span></button></div><h3>Mulai dari yang kamu punya.</h3><p className="help">Edit profil, unggah beberapa foto sekaligus, tambahkan deskripsi, atau simpan sertifikat pembelajaranmu.</p><div className="storage-note">Draf disimpan otomatis di browser. Klik <strong>Publikasikan</strong> untuk menyimpan versi online yang dapat dilihat pengunjung dan dibuka dari perangkat lain.</div><label className="field">Pulihkan backup JSON<input type="file" accept="application/json,.json" onChange={restore} /></label></section>}
      {fields[tab] && <section className="editor-card"><h2>{descriptions[tab][0]}</h2><p className="help">{descriptions[tab][1]}</p>{fields[tab].map(([key, label, type]) => <Field key={key} label={label} type={type} value={data[key]} onChange={value => update(key, value)} maxLength={type === 'textarea' ? 4000 : 250} />)}{['profile', 'experience'].includes(tab) && <div className="upload-card"><h3>{tab === 'profile' ? 'Foto profil' : 'Dokumentasi magang'}</h3>{data[tab === 'profile' ? 'portrait' : 'experiencePhoto'] && <img className="upload-thumb" src={data[tab === 'profile' ? 'portrait' : 'experiencePhoto']} alt="Foto terpilih" />}<label className="field">Unggah gambar<input type="file" accept="image/jpeg,image/png,image/webp" onChange={event => uploadSingle(event, tab === 'profile' ? 'portrait' : 'experiencePhoto')} /></label>{data[tab === 'profile' ? 'portrait' : 'experiencePhoto'] && <button className="btn danger" onClick={() => update(tab === 'profile' ? 'portrait' : 'experiencePhoto', '')}>Hapus foto</button>}</div>}</section>}
      {tab === 'gallery' && <section className="editor-card"><div className="editor-heading"><div><h2>Potongan perjalananmu.</h2><p className="help">Pilih banyak foto sekaligus, lalu ceritakan setiap momennya.</p></div><span className="count-chip">{gallery.length} / 100</span></div><label className="upload-drop">↥ <strong>Tambah foto ke galeri</strong><span>JPG, PNG, WebP · Maksimal 10 MB per foto</span><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={uploadGallery} /></label><p className="help">Foto yang dipublikasikan dapat dilihat pengunjung.</p>{gallery.map((item, index) => <article className="media-editor" key={item.id || index}><div className="media-editor-top"><span>FOTO {String(index + 1).padStart(2, '0')}</span><div className="item-actions"><button className="btn" aria-label={'Naikkan foto ' + (index + 1)} disabled={index === 0} onClick={() => moveItem('gallery', index, -1)}>↑</button><button className="btn" aria-label={'Turunkan foto ' + (index + 1)} disabled={index === gallery.length - 1} onClick={() => moveItem('gallery', index, 1)}>↓</button><button className="btn danger" onClick={() => removeItem('gallery', index)}>Hapus</button></div></div>{item.image ? <img className="media-editor-image" src={item.image} alt={item.caption || 'Foto galeri'} /> : <div className="media-empty">Belum ada gambar</div>}<Field label="Judul / keterangan foto" value={item.caption} onChange={value => updateItem('gallery', index, 'caption', value)} maxLength={160} /><Field label="Deskripsi / cerita di balik foto" value={item.description} type="textarea" onChange={value => updateItem('gallery', index, 'description', value)} /></article>)}{!gallery.length && <p className="empty-editor">Belum ada foto. Unggah momen pertamamu di atas.</p>}</section>}
      {tab === 'certificates' && <section className="editor-card"><div className="editor-heading"><div><h2>Setiap langkah berarti.</h2><p className="help">Sertifikat, pelatihan, penghargaan, dan pencapaian lainnya.</p></div><span className="count-chip">{certificates.length} / 100</span></div><button className="btn primary" onClick={addCertificate} disabled={certificates.length >= 100}>＋ Tambah sertifikat</button><p className="help" style={{ marginTop: 14 }}>Unggah gambar atau PDF. Sertifikat yang dipublikasikan dapat dilihat pengunjung.</p>{certificates.map((item, index) => <article className="media-editor" key={item.id || index}><div className="media-editor-top"><span>SERTIFIKAT {String(index + 1).padStart(2, '0')}</span><div className="item-actions"><button className="btn" aria-label={'Naikkan sertifikat ' + (index + 1)} disabled={index === 0} onClick={() => moveItem('certificates', index, -1)}>↑</button><button className="btn" aria-label={'Turunkan sertifikat ' + (index + 1)} disabled={index === certificates.length - 1} onClick={() => moveItem('certificates', index, 1)}>↓</button><button className="btn danger" onClick={() => removeItem('certificates', index)}>Hapus</button></div></div>{item.image && <img className="media-editor-image certificate-thumbnail" src={item.image} alt={item.title || 'Sertifikat'} />}{item.document && <a className="document-link" href={item.document} target="_blank" rel="noopener noreferrer">▤ Lihat PDF yang diunggah ↗</a>}<label className="field">File sertifikat (gambar atau PDF)<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={event => uploadSingle(event, 'certificates', index)} /></label><Field label="Judul sertifikat / pelatihan" value={item.title} onChange={value => updateItem('certificates', index, 'title', value)} maxLength={200} /><Field label="Penerbit / penyelenggara" value={item.issuer} onChange={value => updateItem('certificates', index, 'issuer', value)} maxLength={200} /><Field label="Tanggal / tahun" value={item.date} onChange={value => updateItem('certificates', index, 'date', value)} maxLength={40} /><Field label="Deskripsi" value={item.description} type="textarea" onChange={value => updateItem('certificates', index, 'description', value)} /><Field label="Tautan kredensial (https://, opsional)" value={item.credentialUrl} type="url" onChange={value => updateItem('certificates', index, 'credentialUrl', value)} maxLength={2048} /></article>)}{!certificates.length && <p className="empty-editor">Belum ada sertifikat. Tambahkan kapan pun kamu siap.</p>}</section>}
    </fieldset><aside className="preview-panel"><div className="preview-toolbar"><span><i className="status-dot" />Live preview</span><div><button className="btn" aria-pressed={!mobile} onClick={() => setMobile(false)}>Lebar</button><button className="btn" aria-pressed={mobile} onClick={() => setMobile(true)}>Ponsel</button></div></div><div className={'preview-shell' + (mobile ? ' mobile' : '')}><iframe ref={frame} title="Preview langsung portofolio" src={prefix + '/preview/'} onLoad={() => setFrameReady(true)} /></div><p className="help">Preview menampilkan draf. Klik Publikasikan jika sudah sesuai.</p></aside></div></main>
  </div>{message && <div className="toast" role="status">{message}</div>}</div>;
}
