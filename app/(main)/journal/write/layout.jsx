import { COLORS } from '@/lib/utils';
import Link from 'next/link';
import React, { Suspense } from 'react';
import { BarLoader } from 'react-spinners';

const WriteLayout = ({ children }) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div>
        <Link
          href="/dashboard"
          className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer"
        >
          &larr; Back to Dashboard
        </Link>
      </div>
      <Suspense fallback={<BarLoader color={COLORS.loader} width={'100%'} />}>
        {children}
      </Suspense>
    </div>
  );
};

export default WriteLayout;
