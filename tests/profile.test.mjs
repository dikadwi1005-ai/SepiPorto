import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeProfile, safeImage, safeAsset, safeLink, emailHref, whatsappHref, STORAGE_KEY } from '../lib/profile.mjs';

const seed = JSON.parse(readFileSync(new URL('../data/portfolio.json', import.meta.url), 'utf8'));

test('Existing dashboard backups retain profile text and images', () => {
  const draft = { ...seed, name: 'Sherlynda <script>alert(1)</script>', portrait: 'data:image/jpeg;base64,YWJj', gallery: [{ image: 'data:image/png;base64,YWJj', caption: 'Dokumentasi magang' }] };
  const result = sanitizeProfile(JSON.parse(JSON.stringify(draft)), seed);
  assert.equal(result.name, draft.name);
  assert.equal(result.portrait, draft.portrait);
  assert.equal(result.gallery[0].caption, 'Dokumentasi magang');
  assert.equal(result.gallery.length, 1);
  assert.equal(STORAGE_KEY, 'sherlynda-portfolio-v2');
  assert.equal(seed.name, 'Sherlynda Puspita Sari');
});

test('Imported images exclude SVG, external URLs, invalid data, and oversized payloads', () => {
  for (const value of ['javascript:alert(1)', 'https://example.com/tracker.jpg', 'data:image/svg+xml;base64,YWJj', 'data:image/png;base64,!', 'data:image/jpeg;base64,' + 'a'.repeat(2200000)]) assert.equal(safeImage(value), '');
  const result = sanitizeProfile({ ...seed, gallery: [{ image: 'javascript:x', caption: '<img src=x>' }] }, seed);
  assert.equal(result.gallery[0].image, '');
  assert.equal(result.gallery[0].caption, '<img src=x>');
  assert.deepEqual(sanitizeProfile(null, seed), seed);
});

test('WhatsApp normalizes Indonesian local numbers and rejects invalid lengths', () => {
  assert.equal(whatsappHref('0858 4380 4116'), 'https://wa.me/6285843804116');
  assert.equal(whatsappHref('+6285843804116'), 'https://wa.me/6285843804116');
  assert.equal(whatsappHref('abc'), null);
  assert.equal(whatsappHref('1'.repeat(20)), null);
  assert.equal(emailHref('sherlynda08@gmail.com'), 'mailto:sherlynda08@gmail.com');
  assert.equal(emailHref('javascript:alert(1)'), null);
});

test('Static export supports custom-domain root and GitHub project subpaths', async () => {
  const previous = process.env.NEXT_PUBLIC_BASE_PATH;
  try {
    process.env.NEXT_PUBLIC_BASE_PATH = '';
    const root = (await import('../next.config.mjs?root')).default;
    assert.equal(root.output, 'export');
    assert.equal(root.basePath, '');
    process.env.NEXT_PUBLIC_BASE_PATH = '/portofoliosherly/';
    const project = (await import('../next.config.mjs?project')).default;
    assert.equal(project.basePath, '/portofoliosherly');
    assert.equal(project.trailingSlash, true);
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH; else process.env.NEXT_PUBLIC_BASE_PATH = previous; }
});

test('Gallery keeps multiple photos and descriptions instead of padding or truncating to three', () => {
  const draft = { ...seed, gallery: Array.from({ length: 12 }, (_, i) => ({ id: 'photo-' + i, caption: 'Momen ' + i, description: 'Cerita di balik foto ' + i, image: 'data:image/jpeg;base64,YWJj' })) };
  const restored = sanitizeProfile(JSON.parse(JSON.stringify(draft)), seed);
  assert.equal(restored.gallery.length, 12);
  assert.equal(restored.gallery[11].description, 'Cerita di balik foto 11');
  assert.equal(restored.gallery[11].id, 'photo-11');
  assert.equal(sanitizeProfile({ ...seed, gallery: [] }, seed).gallery.length, 0);
  assert.equal(sanitizeProfile({ ...draft, gallery: Array(120).fill(draft.gallery[0]) }, seed).gallery.length, 100);
});

test('Certificates retain metadata and public documents while rejecting unsafe links', () => {
  const url = 'https://ocgmtnoyvzslgkhgxrzk.supabase.co/storage/v1/object/public/portfolio-media/admin/certificate.pdf';
  const result = sanitizeProfile({ ...seed, certificates: [{ title: 'Pelatihan', issuer: 'Penyelenggara', date: '2026', description: 'Deskripsi sertifikat', document: url, credentialUrl: 'javascript:alert(1)' }] }, seed);
  assert.equal(result.certificates[0].document, url);
  assert.equal(result.certificates[0].description, 'Deskripsi sertifikat');
  assert.equal(result.certificates[0].credentialUrl, '');
  assert.equal(safeAsset('https://other.example/file.pdf'), '');
  assert.equal(safeLink('https://user:secret@example.com'), '');
  assert.equal(safeLink('https://example.com/credential'), 'https://example.com/credential');
});
