export function isPublicAuthKey(key) {
  if (typeof key !== 'string') return false;
  if (key.startsWith('sb_publishable_') && key.length > 20) return true;
  try {
    const encoded = key.split('.')[1];
    if (!encoded) return false;
    const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    return payload.role === 'anon';
  } catch { return false; }
}

export function isAuthConfigured(config) {
  try {
    const url = new URL(config.url);
    return url.protocol === 'https:' && !url.username && !url.password && isPublicAuthKey(config.publishableKey) &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.adminUserId) &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.adminEmail);
  } catch { return false; }
}

export async function verifyAdmin(auth, config) {
  try {
    const { data, error } = await auth.getUser();
    const user = data?.user;
    if (error || !user?.email_confirmed_at || user.id !== config.adminUserId ||
      user.email?.toLowerCase() !== config.adminEmail.toLowerCase()) return null;
    return user;
  } catch { return null; }
}
