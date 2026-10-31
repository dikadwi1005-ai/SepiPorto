import './globals.css';

export const metadata = {
  metadataBase: new URL('https://sherlyndaps.my.id'),
  title: { default: 'Sherlynda Puspita Sari — Personal collection', template: '%s · Sherlynda' },
  description: 'Portofolio Sherlynda Puspita Sari, fresh graduate Pendidikan Sejarah dengan pengalaman magang di Perkumpulan Ruang Belajar Aqil.',
};

export const viewport = { themeColor: '#110d15' };

export default function RootLayout({ children }) {
  return <html lang="id"><body>{children}</body></html>;
}
