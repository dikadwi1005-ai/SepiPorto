import test from 'node:test';
import assert from 'node:assert/strict';
import { isAuthConfigured, isPublicAuthKey, verifyAdmin } from '../lib/auth-policy.mjs';

const config = { url: 'https://example.supabase.co', publishableKey: 'sb_publishable_example_test_key', adminUserId: '12345678-1234-1234-1234-123456789abc', adminEmail: 'sherlynda08@gmail.com' };
const user = { id: config.adminUserId, email: config.adminEmail, email_confirmed_at: '2026-10-31T00:00:00Z' };

test('Login stays unconfigured until a public provider key and a pinned admin exist', () => {
  assert.equal(isAuthConfigured(config), true);
  assert.equal(isAuthConfigured({ ...config, adminUserId: '' }), false);
  assert.equal(isAuthConfigured({ ...config, url: 'http://example.supabase.co' }), false);
  assert.equal(isAuthConfigured({ ...config, publishableKey: 'sb_secret_do_not_expose' }), false);
  const jwt = role => 'header.' + btoa(JSON.stringify({ role })) + '.signature';
  assert.equal(isPublicAuthKey(jwt('service_role')), false);
  assert.equal(isPublicAuthKey(jwt('anon')), true);
});

test('Only a server-validated, confirmed user matching both ID and email is admitted', async () => {
  const api = data => ({ getUser: async () => ({ data: { user: data }, error: null }) });
  assert.equal(await verifyAdmin(api(user), config), user);
  assert.equal(await verifyAdmin(api({ ...user, id: 'another-user' }), config), null);
  assert.equal(await verifyAdmin(api({ ...user, email: 'other@example.com' }), config), null);
  assert.equal(await verifyAdmin(api({ ...user, email_confirmed_at: null }), config), null);
  assert.equal(await verifyAdmin(api(null), config), null);
});

test('Provider rejection and network failure never admit an existing or forged user', async () => {
  assert.equal(await verifyAdmin({ getUser: async () => ({ data: { user }, error: new Error('Invalid JWT') }) }, config), null);
  assert.equal(await verifyAdmin({ getUser: async () => { throw new Error('offline'); } }, config), null);
});
