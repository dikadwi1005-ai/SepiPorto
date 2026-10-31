'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import seed from '../data/portfolio.json';
import { sanitizeProfile, STORAGE_KEY } from '../lib/profile.mjs';
import { DRAFT_KEY, RECOVERY_KEY, selectDraft } from '../lib/draft-state.mjs';
import { loadPublishedRecord } from '../lib/content-client';

export default function useProfile({ persist = false, livePreview = false } = {}) {
  const [data, reactSetData] = useState(seed);
  const current = useRef(seed);
  const version = useRef(undefined);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('Memuat versi online…');
  const persistDraft = useCallback(next => {
    if (!persist) return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ data: next, version: version.current }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStatus('✓ Draf tersimpan di browser');
    } catch { setStatus('Draf belum tersimpan: penyimpanan penuh/tidak tersedia. Backup sekarang.'); }
  }, [persist]);
  const setData = useCallback(change => {
    const next = typeof change === 'function' ? change(current.current) : change;
    current.current = next;
    persistDraft(next);
    reactSetData(next);
  }, [persistDraft]);
  useEffect(() => {
    let active = true;
    async function load() {
      if (livePreview) { setLoaded(true); return; }
      try {
        const remote = await loadPublishedRecord();
        if (!active) return;
        let initial = remote.data;
        let conflict = false;
        if (persist) {
          const saved = localStorage.getItem(DRAFT_KEY);
          if (saved) {
            const draft = JSON.parse(saved);
            const selected = selectDraft(remote, draft);
            initial = sanitizeProfile(selected.data, seed);
            conflict = selected.conflict;
            if (conflict) localStorage.setItem(RECOVERY_KEY, JSON.stringify(draft.data));
          } else {
            const legacy = localStorage.getItem(STORAGE_KEY);
            if (legacy) {
              const legacyData = sanitizeProfile(JSON.parse(legacy), seed);
              if (remote.version === null) initial = legacyData;
              else if (JSON.stringify(legacyData) !== JSON.stringify(remote.data)) {
                // Old drafts have no server version: preserve them for recovery, never
                // silently bless them with the latest version and overwrite newer media.
                localStorage.setItem(RECOVERY_KEY, JSON.stringify(legacyData));
                conflict = true;
              }
            }
          }
        }
        version.current = remote.version;
        current.current = initial;
        reactSetData(initial);
        persistDraft(initial);
        if (conflict) setStatus('Versi online terbaru dimuat. Draf lama tersedia lewat Backup draf sebelumnya.');
        setLoaded(true);
      } catch {
        if (active) setStatus('Versi online belum dapat dimuat. Refresh setelah koneksi pulih; pengeditan dikunci agar data lama tidak tertimpa.');
      }
    }
    load();
    return () => { active = false; };
  }, [persist, livePreview, persistDraft]);
  const replaceData = useCallback(raw => setData(sanitizeProfile(raw, seed)), [setData]);
  const acceptPublished = useCallback(result => { version.current = result.version; setData(result.data); }, [setData]);
  return { data, setData, replaceData, acceptPublished, version, loaded, status };
}
