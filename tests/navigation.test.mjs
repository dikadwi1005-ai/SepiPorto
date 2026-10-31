import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionAtViewport } from '../lib/navigation.mjs';

test('sidebar follows the section heading across desktop and mobile viewports', () => {
  for (const height of [844, 950, 1516]) {
    const sections = [
      { id: 'utama', top: -2300 }, { id: 'tentang', top: -1800 },
      { id: 'pengalaman', top: -1200 }, { id: 'galeri', top: -400 },
      { id: 'sertifikat', top: 110 },
    ];
    assert.equal(sectionAtViewport(sections, height), 'sertifikat');
    assert.equal(sectionAtViewport(sections.map(item => ({ ...item, top: item.top + 600 })), height), 'galeri');
  }
});

test('home and section gaps are stable; a tall gallery does not keep achievements inactive', () => {
  assert.equal(sectionAtViewport([{ id: 'utama', top: 90 }, { id: 'tentang', top: 900 }], 950), 'utama');
  assert.equal(sectionAtViewport([{ id: 'utama', top: -9000 }, { id: 'galeri', top: -7000 }, { id: 'sertifikat', top: 80 }], 950), 'sertifikat');
});
