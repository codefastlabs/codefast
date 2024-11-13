import localFont from 'next/font/local';

export const geistSans = localFont({
  src: './geist/GeistVF.woff',
  variable: '--font-sans',
  weight: '100 900',
});

export const geistMono = localFont({
  src: './geist/GeistMonoVF.woff',
  variable: '--font-mono',
  weight: '100 900',
});
