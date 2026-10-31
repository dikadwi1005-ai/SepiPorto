export const DRAFT_KEY = 'sherlynda-portfolio-draft-v3';
export const RECOVERY_KEY = 'sherlynda-portfolio-recovery-v3';

export function selectDraft(remote, draft) {
  if (!draft || !draft.data) return { ...remote, conflict: false };
  if (draft.version !== remote.version) return { ...remote, conflict: true };
  return { data: draft.data, version: draft.version, conflict: false };
}

export async function savePublishedRecord(client, data, version) {
  const previousTime = Date.parse(version || '') || 0;
  const nextVersion = new Date(Math.max(Date.now(), previousTime + 1)).toISOString();
  const row = { id: 'main', data, updated_at: nextVersion };
  const table = client.from('portfolio_content');
  const query = version === null
    ? table.insert(row)
    : table.update(row).eq('id', 'main').eq('updated_at', version);
  const result = await query.select('updated_at').maybeSingle();
  if (result.error?.code === '23505' || (!result.error && !result.data)) {
    throw new Error('Versi online sudah berubah dari tab atau perangkat lain. Backup draf ini, lalu muat versi online terbaru sebelum melanjutkan.');
  }
  if (result.error) throw new Error('Perubahan belum diterbitkan. Periksa koneksi dan coba lagi.');
  return { data, version: result.data.updated_at };
}
