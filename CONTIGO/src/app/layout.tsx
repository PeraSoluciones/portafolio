import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Sidebar } from '@/components/layout/Sidebar';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Z.ai Code Scaffold - AI-Powered Development',
  description:
    'Modern Next.js scaffold optimized for AI-powered development with Z.ai. Built with TypeScript, Tailwind CSS, and shadcn/ui.',
  keywords: [
    'Z.ai',
    'Next.js',
    'TypeScript',
    'Tailwind CSS',
    'shadcn/ui',
    'AI development',
    'React',
  ],
  authors: [{ name: 'Z.ai Team' }],
  openGraph: {
    title: 'Z.ai Code Scaffold',
    description: 'AI-powered development with modern React stack',
    url: 'https://chat.z.ai',
    siteName: 'Z.ai',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Z.ai Code Scaffold',
    description: 'AI-powered development with modern React stack',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-foreground overflow-hidden`}
        suppressHydrationWarning={true}
      >
        <div className='flex h-screen'>
          <Sidebar />
          <main className='flex-1 md:ml-64 w-full overflow-y-auto bg-gray-50 pt-20 md:pt-8'>
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
              {children}
            </div>
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
