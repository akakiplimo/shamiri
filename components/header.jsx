import { SignedIn, UserButton } from '@clerk/nextjs';
import { SignedOut, SignInButton, SignUpButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Button } from './ui/button';
import { PenBox, FolderOpen } from 'lucide-react';
import UserMenu from './UserMenu';
import { checkUser } from '@/lib/checkUser';

const Header = async () => {
  await checkUser();
  return (
    <header className="container">
      <nav className="flex justify-between items-center py-6 px-4">
        <Link href={'/'}>
          <Image
            src={'/logo.png'}
            alt="Shamiri Logo"
            priority={true}
            width={200}
            height={60}
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-4">
          <SignedIn>
            <Link href={'/dashboard#categories'}>
              <Button variant="outline" className="flex items-center gap-2">
                <FolderOpen size={18} />
                <span className="hidden md:inline">Categories</span>
              </Button>
            </Link>
          </SignedIn>

          <Link href={'/journal/write'}>
            <Button variant="shamiri" className="flex items-center gap-2">
              <PenBox size={18} />
              <span className="hidden md:inline">Write New</span>
            </Button>
          </Link>

          <SignedOut>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline">Login</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <UserMenu />
          </SignedIn>
        </div>
      </nav>
    </header>
  );
};

export default Header;
