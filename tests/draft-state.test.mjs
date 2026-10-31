import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDraft, savePublishedRecord } from '../lib/draft-state.mjs';

test('refresh keeps the complete matching draft, but cannot prefer an outdated draft over online data', () => {
  const data = { portrait: 'profile.jpg', gallery: [{ image: 'gallery.jpg' }], certificates: [{ document: 'cert.pdf' }] };
  const remote = { data, version: 'v2' };
  assert.deepEqual(selectDraft(remote, { data, version: 'v2' }).data, data);
  const outdated = selectDraft(remote, { data: { portrait: '' }, version: 'v1' });
  assert.equal(outdated.conflict, true);
  assert.equal(outdated.data.portrait, 'profile.jpg');
});

test('publish and reload preserve profile, gallery and certificates; a second stale tab cannot replace them', async () => {
  let stored = { data: {}, updated_at: 'initial' };
  const client = { from() { let row, expected; return {
    update(value) { row = value; return this; },
    insert(value) { row = value; return this; },
    eq(key, value) { if (key === 'updated_at') expected = value; return this; },
    select() { return this; },
    async maybeSingle() {
      if (stored.updated_at !== expected) return { data: null, error: null };
      stored = row;
      return { data: { updated_at: row.updated_at }, error: null };
    },
  }; } };
  const data = { portrait: 'profile.jpg', gallery: [{ image: 'moment.jpg' }], certificates: [{ image: 'cover.jpg', document: 'certificate.pdf' }] };
  const saved = await savePublishedRecord(client, data, 'initial');
  assert.deepEqual(stored.data, data);
  assert.deepEqual(selectDraft({ data: stored.data, version: stored.updated_at }, saved).data, data);
  await assert.rejects(savePublishedRecord(client, { portrait: '' }, 'initial'), /Versi online sudah berubah/);
  assert.deepEqual(stored.data, data);
});
