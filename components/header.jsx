import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const Header = () => {
  return (
    <header className="container">
      <nav className="flex justify-between items-center py-6 px-4">
        <Link href={'/'}>
          <Image
            src={'/logo.png'}
            alt="Shamiri Logo"
            width={200}
            height={60}
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-4">
          {/* Login and other calls to action */}
        </div>
      </nav>
    </header>
  );
};

export default Header;
