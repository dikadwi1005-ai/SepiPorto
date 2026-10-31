import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeProfile, safeImage, emailHref, whatsappHref, STORAGE_KEY } from '../lib/profile.mjs';

const seed = JSON.parse(readFileSync(new URL('../data/portfolio.json', import.meta.url), 'utf8'));

test('Existing dashboard backups retain profile text and images', () => {
  const draft = { ...seed, name: 'Sherlynda <script>alert(1)</script>', portrait: 'data:image/jpeg;base64,YWJj', gallery: [{ image: 'data:image/png;base64,YWJj', caption: 'Dokumentasi magang' }] };
  const result = sanitizeProfile(JSON.parse(JSON.stringify(draft)), seed);
  assert.equal(result.name, draft.name);
  assert.equal(result.portrait, draft.portrait);
  assert.equal(result.gallery[0].caption, 'Dokumentasi magang');
  assert.equal(result.gallery.length, 3);
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
