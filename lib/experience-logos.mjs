import { safeImage } from './profile.mjs';

export const EXPERIENCE_LOGOS = [
  { key: 'companyLogo', visible: 'showCompanyLogo', label: 'Logo tempat magang', caption: 'Ruang Belajar Aqil', file: '/logos/ruang-belajar-aqil.png' },
  { key: 'programLogo', visible: 'showProgramLogo', label: 'Logo program magang', caption: 'Magang Merdeka (MSIB)', file: '/logos/magang-merdeka-msib.png' },
];

export function experienceLogo(data, logo, basePath = '') {
  if (data[logo.visible] === false) return '';
  const uploaded = safeImage(data[logo.key]);
  if (uploaded) return uploaded;
  if (logo.key === 'companyLogo' && !/ruang\s*belajar\s*aqil/i.test(data.company || '')) return '';
  return basePath + logo.file;
}
