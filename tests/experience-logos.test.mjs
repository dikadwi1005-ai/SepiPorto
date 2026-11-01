import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sanitizeProfile } from '../lib/profile.mjs';
import { EXPERIENCE_LOGOS, experienceLogo } from '../lib/experience-logos.mjs';

const seed = JSON.parse(readFileSync(new URL('../data/portfolio.json', import.meta.url), 'utf8'));

test('legacy published profiles receive both default logos without replacing any media', () => {
  const portrait = 'data:image/png;base64,YWJj';
  const profile = sanitizeProfile({ ...seed, portrait, gallery: [{ id: 'photo', image: portrait, caption: 'Magang' }] }, seed);
  assert.equal(profile.portrait, portrait);
  assert.equal(profile.gallery[0].image, portrait);
  assert.equal(experienceLogo(profile, EXPERIENCE_LOGOS[0]), '/logos/ruang-belajar-aqil.png');
  assert.equal(experienceLogo(profile, EXPERIENCE_LOGOS[1], '/SepiPorto'), '/SepiPorto/logos/magang-merdeka-msib.png');
});

test('custom logos and visibility survive publish/refresh independently', () => {
  const image = 'https://ocgmtnoyvzslgkhgxrzk.supabase.co/storage/v1/object/public/portfolio-media/admin/logo.png';
  const restored = sanitizeProfile(JSON.parse(JSON.stringify({ ...seed, companyLogo: image, programLogo: image, showProgramLogo: false })), seed);
  assert.equal(experienceLogo(restored, EXPERIENCE_LOGOS[0]), image);
  assert.equal(experienceLogo(restored, EXPERIENCE_LOGOS[1]), '');
  assert.equal(restored.programLogo, image);
  assert.equal(experienceLogo({ ...restored, showProgramLogo: true }, EXPERIENCE_LOGOS[1]), image);
  assert.equal(sanitizeProfile({ ...seed, companyLogo: 'https://example.com/logo.png' }, seed).companyLogo, '');
  assert.equal(experienceLogo({ ...seed, company: 'Tempat lain' }, EXPERIENCE_LOGOS[0]), '');
});
