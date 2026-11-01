import { getAuthClient } from './auth-client';
import { verifyAdmin } from './auth-policy.mjs';
import config from '../data/auth-config.json';
import { sanitizeProfile } from './profile.mjs';
import seed from '../data/portfolio.json';
import { savePublishedRecord } from './draft-state.mjs';

export async function loadPublishedRecord() {
  const client = getAuthClient();
  if (!client) throw new Error('Penyimpanan online belum tersedia.');
  const { data, error } = await client.from('portfolio_content').select('data,updated_at').eq('id', 'main').maybeSingle();
  if (error) throw error;
  return { data: data?.data ? sanitizeProfile(data.data, seed) : seed, version: data?.updated_at || null };
}

export async function loadPublishedProfile() { return (await loadPublishedRecord()).data; }

export async function listUploadedMedia() {
  const client = getAuthClient();
  const admin = client && await verifyAdmin(client.auth, config);
  if (!admin) throw new Error('Masuk kembali untuk membuka file tersimpan.');
  const bucket = client.storage.from('portfolio-media');
  const { data, error } = await bucket.list(admin.id, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
  if (error) throw new Error('Daftar file belum dapat dimuat. Coba lagi.');
  return (data || []).filter(item => item.id).map(item => ({
    name: item.name,
    pdf: item.name.toLowerCase().endsWith('.pdf'),
    url: bucket.getPublicUrl(admin.id + '/' + item.name).data.publicUrl,
  }));
}

export async function uploadMedia(file) {
  const client = getAuthClient();
  const admin = client && await verifyAdmin(client.auth, config);
  if (!admin) throw new Error('Sesi admin berakhir. Masuk kembali sebelum mengunggah.');
  const allowed = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  const extension = allowed[file.type];
  if (!extension || file.size > 10 * 1024 * 1024) throw new Error('Gunakan gambar atau PDF maksimal 10 MB.');
  const path = admin.id + '/' + crypto.randomUUID() + '.' + extension;
  const { error } = await client.storage.from('portfolio-media').upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false });
  if (error) throw new Error('Unggah belum berhasil. Periksa koneksi atau coba file yang lebih kecil.');
  return client.storage.from('portfolio-media').getPublicUrl(path).data.publicUrl;
}

export async function publishProfile(raw, version) {
  if (version === undefined) throw new Error('Muat versi online sebelum menerbitkan.');
  const client = getAuthClient();
  if (!client || !await verifyAdmin(client.auth, config)) throw new Error('Sesi admin berakhir. Masuk kembali untuk menerbitkan.');
  const data = sanitizeProfile(raw, seed);
  async function migrateImage(value) {
    if (!value.startsWith('data:image/')) return value;
    const blob = await (await fetch(value)).blob();
    return uploadMedia(blob);
  }
  data.portrait = await migrateImage(data.portrait);
  data.experiencePhoto = await migrateImage(data.experiencePhoto);
  data.companyLogo = await migrateImage(data.companyLogo);
  data.programLogo = await migrateImage(data.programLogo);
  for (const item of data.gallery) item.image = await migrateImage(item.image);
  for (const item of data.certificates) item.image = await migrateImage(item.image);
  return savePublishedRecord(client, data, version);
}

