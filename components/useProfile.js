'use client';

import { useCallback, useEffect, useState } from 'react';
import seed from '../data/portfolio.json';
import { sanitizeProfile, STORAGE_KEY } from '../lib/profile.mjs';
import { loadPublishedProfile } from '../lib/content-client';

export default function useProfile({ persist = false, livePreview = false } = {}) {
  const [data, setData] = useState(seed);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('Draf siap');

  useEffect(() => {
    let active = true;
    async function load() {
      let initial = seed;
      if (!livePreview) { try { initial = await loadPublishedProfile(); } catch { /* Retain the static fallback when offline. */ } }
      if (persist || livePreview) {
        try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) initial = sanitizeProfile(JSON.parse(saved), seed); }
        catch { if (active) setStatus('Penyimpanan browser tidak tersedia; gunakan backup.'); }
      }
      if (active) { setData(initial); setLoaded(true); }
    }
    load();
    return () => { active = false; };
  }, [persist, livePreview]);

  useEffect(() => {
    if (!persist || !loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStatus('✓ Tersimpan di browser');
    } catch { setStatus('Draf belum tersimpan: penyimpanan penuh/tidak tersedia. Backup sekarang.'); }
  }, [data, loaded, persist]);

  const replaceData = useCallback(raw => setData(sanitizeProfile(raw, seed)), []);
  return { data, setData, replaceData, loaded, status };
}
