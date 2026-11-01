export const STORAGE_KEY = 'sherlynda-portfolio-v2';
export const TEXT_KEYS = ['name', 'shortName', 'headline', 'intro', 'bio', 'degree', 'university', 'company', 'role', 'experience', 'period', 'organization', 'organizationDetail', 'email', 'phone'];

export function safeImage(value) {
  if (typeof value !== 'string') return '';
  if (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 2200000) return value;
  return safeAsset(value);
}

export function safeAsset(value) {
  if (typeof value !== 'string' || value.length > 2048) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'ocgmtnoyvzslgkhgxrzk.supabase.co' &&
      url.pathname.startsWith('/storage/v1/object/public/portfolio-media/') && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

export function safeLink(value) {
  if (typeof value !== 'string' || value.length > 2048) return '';
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : ''; }
  catch { return ''; }
}

export function sanitizeProfile(raw, seed) {
  const data = structuredClone(seed);
  if (!raw || typeof raw !== 'object') return data;
  for (const key of TEXT_KEYS) if (typeof raw[key] === 'string') data[key] = raw[key].slice(0, 5000);
  for (const key of ['portrait', 'experiencePhoto', 'companyLogo', 'programLogo']) data[key] = safeImage(raw[key]);
  for (const key of ['showCompanyLogo', 'showProgramLogo']) data[key] = typeof raw[key] === 'boolean' ? raw[key] : true;
  const text = (value, max = 4000) => typeof value === 'string' ? value.slice(0, max) : '';
  data.gallery = (Array.isArray(raw.gallery) ? raw.gallery : seed.gallery).slice(0, 100).map((item, i) => ({
    id: text(item?.id, 80) || 'gallery-' + i,
    image: safeImage(item?.image),
    caption: text(item?.caption, 160),
    description: text(item?.description),
  }));
  data.certificates = (Array.isArray(raw.certificates) ? raw.certificates : seed.certificates || []).slice(0, 100).map((item, i) => ({
    id: text(item?.id, 80) || 'certificate-' + i,
    title: text(item?.title, 200), issuer: text(item?.issuer, 200), date: text(item?.date, 40),
    description: text(item?.description), image: safeImage(item?.image), document: safeAsset(item?.document),
    credentialUrl: safeLink(item?.credentialUrl),
  }));
  return data;
}

export function whatsappHref(value) {
  let phone = String(value || '').replace(/\D/g, '');
  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
  return /^\d{8,16}$/.test(phone) ? 'https://wa.me/' + phone : null;
}

export function emailHref(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '') ? 'mailto:' + value : null;
}

