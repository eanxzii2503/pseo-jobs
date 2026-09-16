import type { Metadata } from 'next';
import { IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID;

const display = Source_Serif_4({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display'
});

const body = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-body'
});

export const metadata: Metadata = {
  title: {
    default: 'Remote Roles — Fresh remote jobs, updated daily',
    template: '%s | Remote Roles'
  },
  description: 'A daily-updated directory of remote jobs pulled from open job providers, organized by category and location.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="bg-paper text-ink font-body antialiased">
        {children}
        {/* Only loads if NEXT_PUBLIC_GA_ID is set — leave it unset locally,
            add the real G-XXXXXXXXXX id as an env var in Vercel for production. */}
        {GA_MEASUREMENT_ID ? (
          <>
            <Script
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        ) : null}
      </body>
    </html>
  );
}
