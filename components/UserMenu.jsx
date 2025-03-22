'use client';
import React from 'react';
import { UserButton } from '@clerk/nextjs';
import { LayoutDashboard } from 'lucide-react';

const UserMenu = () => {
  return (
    <UserButton appearance={{ elements: { avatarBox: 'w-15 h-15' } }}>
      <UserButton.MenuItems>
        <UserButton.Link
          label="Dashboard"
          labelIcon={<LayoutDashboard size={15} />}
          href="/dashboard"
        />
        <UserButton.Action label="manageAccount" />
      </UserButton.MenuItems>
    </UserButton>
  );
};

export default UserMenu;
