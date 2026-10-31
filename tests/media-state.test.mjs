import test from 'node:test';
import assert from 'node:assert/strict';
import { mediaPatch, updateCertificateMedia } from '../lib/media-state.mjs';

test('image then PDF then replacement image retain both assets and unrelated content', () => {
  let profile = { portrait: 'portrait.jpg', gallery: [{ image: 'moment.jpg' }], certificates: [
    { id: 'a', title: 'Pelatihan', description: 'Cerita', image: '', document: '' },
    { id: 'b', title: 'Lainnya', image: 'other.jpg', document: 'other.pdf' },
  ] };
  profile = updateCertificateMedia(profile, 'a', mediaPatch('cover.jpg'));
  profile = updateCertificateMedia(profile, 'a', mediaPatch('certificate.pdf', true));
  profile = updateCertificateMedia(profile, 'a', mediaPatch('new-cover.jpg'));
  assert.deepEqual(profile.certificates[0], { id: 'a', title: 'Pelatihan', description: 'Cerita', image: 'new-cover.jpg', document: 'certificate.pdf' });
  assert.equal(profile.portrait, 'portrait.jpg');
  assert.equal(profile.gallery[0].image, 'moment.jpg');
  assert.equal(profile.certificates[1].document, 'other.pdf');
});

test('in-flight upload addresses stable certificate ID after reorder or removal', () => {
  const profile = { certificates: [{ id: 'b', image: 'b.jpg' }, { id: 'a', image: 'a.jpg' }] };
  assert.equal(updateCertificateMedia(profile, 'a', mediaPatch('a.pdf', true)).certificates[1].document, 'a.pdf');
  assert.deepEqual(updateCertificateMedia(profile, 'deleted', mediaPatch('x.pdf', true)), profile);
});
