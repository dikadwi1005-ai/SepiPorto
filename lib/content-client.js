import { getAuthClient } from './auth-client';
import { verifyAdmin } from './auth-policy.mjs';
import config from '../data/auth-config.json';
import { sanitizeProfile } from './profile.mjs';
import seed from '../data/portfolio.json';

export async function loadPublishedProfile() {
  const client = getAuthClient();
  if (!client) return seed;
  const { data, error } = await client.from('portfolio_content').select('data').eq('id', 'main').maybeSingle();
  if (error) throw error;
  return data?.data ? sanitizeProfile(data.data, seed) : seed;
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

export async function publishProfile(raw) {
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
  for (const item of data.gallery) item.image = await migrateImage(item.image);
  for (const item of data.certificates) item.image = await migrateImage(item.image);
  const { error } = await client.from('portfolio_content').upsert({ id: 'main', data, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) throw new Error('Perubahan belum diterbitkan. Periksa koneksi dan coba lagi.');
  return data;
}
