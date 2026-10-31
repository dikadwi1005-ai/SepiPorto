'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import config from '../data/auth-config.json';
import { isAuthConfigured, verifyAdmin } from '../lib/auth-policy.mjs';
import { getAuthClient } from '../lib/auth-client';

const Dashboard = dynamic(() => import('./Dashboard'), { ssr: false, loading: () => <div className="login-loading" role="status">Membuka studio…</div> });

export default function AdminAccess() {
  const configured = isAuthConfigured(config);
  const [state, setState] = useState('checking');
  const [email, setEmail] = useState(config.adminEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);

  useEffect(() => {
    const client = getAuthClient();
    if (!client) { setState('unconfigured'); return; }
    let active = true;
    let timer;
    async function check() {
      const version = ++generation.current;
      const user = await verifyAdmin(client.auth, config);
      if (active && generation.current === version) setState(user ? 'authorized' : 'login');
    }
    check();
    const { data: { subscription } } = client.auth.onAuthStateChange(event => {
      if (!active) return;
      if (event === 'SIGNED_OUT') { ++generation.current; setState('login'); return; }
      // Run outside the auth callback's lock before asking the server to validate the user.
      clearTimeout(timer);
      timer = setTimeout(check, 0);
    });
    return () => { active = false; ++generation.current; clearTimeout(timer); subscription.unsubscribe(); };
  }, []);

  async function signIn(event) {
    event.preventDefault();
    if (!configured || busy) return;
    setBusy(true);
    setError('');
    const client = getAuthClient();
    try {
      const { error: loginError } = await client.auth.signInWithPassword({ email: email.trim(), password });
      setPassword('');
      if (loginError) throw new Error('Email atau password tidak sesuai, atau login sedang tidak tersedia.');
      const user = await verifyAdmin(client.auth, config);
      if (!user) {
        await client.auth.signOut({ scope: 'local' });
        throw new Error('Akun ini tidak memiliki akses ke studio.');
      }
      setState('authorized');
    } catch (failure) {
      setState('login');
      setError(failure.message || 'Tidak dapat masuk. Periksa koneksi dan coba lagi.');
    } finally { setBusy(false); }
  }

  async function signOut() {
    ++generation.current;
    setState('login');
    setPassword('');
    setBusy(true);
    try { await getAuthClient()?.auth.signOut({ scope: 'local' }); }
    finally { setBusy(false); }
  }

  if (state === 'authorized') return <Dashboard onSignOut={signOut} />;

  return <main className="login-page"><div className="login-orb" aria-hidden="true" /><section className="login-card">
    <Link href="/" className="login-back">← Kembali ke portofolio</Link>
    <div className="login-mark" aria-hidden="true">s<span>.</span></div>
    <div className="eyebrow">Your personal creative space</div>
    <h1>Welcome to<br /><span>your studio.</span></h1>
    <p className="login-intro">Masuk untuk merawat cerita dan memperbarui portofoliomu.</p>
    {state === 'checking' ? <div className="login-loading" role="status">Memeriksa sesi…</div> :
      <form onSubmit={signIn}>
        <label className="field">Email<input type="email" name="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required disabled={!configured || busy} /></label>
        <label className="field">Password<div className="password-field"><input type={showPassword ? 'text' : 'password'} name="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={!configured || busy} /><button type="button" aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Sembunyikan' : 'Lihat'}</button></div></label>
        {error && <p className="login-error" role="alert">{error}</p>}
        {!configured && <p className="login-notice" role="status">Login admin sedang disiapkan. Studio akan tersedia setelah akun admin diaktifkan.</p>}
        <button type="submit" className="btn primary login-submit" disabled={!configured || busy}>{busy ? 'Memeriksa…' : 'Masuk ke studio ↗'}</button>
      </form>}
    <p className="login-foot">A private space for your next chapter.</p>
  </section></main>;
}
