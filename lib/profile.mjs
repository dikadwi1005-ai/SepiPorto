export const STORAGE_KEY = 'sherlynda-portfolio-v2';
export const TEXT_KEYS = ['name', 'shortName', 'headline', 'intro', 'bio', 'degree', 'university', 'company', 'role', 'experience', 'period', 'organization', 'organizationDetail', 'email', 'phone'];

export function safeImage(value) {
  return typeof value === 'string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value) && value.length < 2200000 ? value : '';
}

export function sanitizeProfile(raw, seed) {
  const data = structuredClone(seed);
  if (!raw || typeof raw !== 'object') return data;
  for (const key of TEXT_KEYS) if (typeof raw[key] === 'string') data[key] = raw[key].slice(0, 5000);
  for (const key of ['portrait', 'experiencePhoto']) data[key] = safeImage(raw[key]);
  data.gallery = Array.from({ length: 3 }, (_, i) => ({
    image: safeImage(raw.gallery?.[i]?.image),
    caption: typeof raw.gallery?.[i]?.caption === 'string' ? raw.gallery[i].caption.slice(0, 160) : seed.gallery[i].caption,
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
