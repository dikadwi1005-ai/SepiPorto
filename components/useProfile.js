'use client';

import { useCallback, useEffect, useState } from 'react';
import seed from '../data/portfolio.json';
import { sanitizeProfile, STORAGE_KEY } from '../lib/profile.mjs';

export default function useProfile({ persist = false } = {}) {
  const [data, setData] = useState(seed);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState('Draf siap');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData(sanitizeProfile(JSON.parse(saved), seed));
    } catch { setStatus('Penyimpanan browser tidak tersedia; gunakan backup.'); }
    setLoaded(true);
  }, []);

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
