import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/header';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({
  subsets: ['latin'],
});

export const metadata = {
  title: 'Shamiri',
  description: 'A Personal Journaling App',
  'apple-mobile-web-app-title': 'Shamiri',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className}`}>
          <div className="bg-[url('/bg.jpg')] opacity-50 fixed -z-10 inset-0" />
          <Header />
          <main className="min-h-screen">{children}</main>

          <Toaster richColors />
          <footer className="bg-blue-300/5 py-12">
            <div className="mx-auto px-4 text-center text-gray-900">
              <p>Made with 💚 by AbraCodeAbra</p>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
