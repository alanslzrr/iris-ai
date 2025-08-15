'use client';

import { 
  Row, 
  Column, 
  Text, 
  Avatar,
  Button,
  Line
} from '@once-ui-system/core';
import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

export function SidebarUserInfo() {
  const { data: session } = useSession();

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  return (
    <Column 
      fillWidth 
      gap="16" 
      padding="16"
      borderTop="neutral-alpha-medium"
      style={{ marginTop: 'auto' }}
    >
      <Row 
        fillWidth 
        horizontal="start" 
        vertical="center" 
        gap="12"
      >
        <Avatar
          size="m"
          background="brand-alpha-weak"
          border="brand-alpha-medium"
          radius="l"
        >
          {session?.user?.image ? (
            <Image
              src={session.user.image}
              alt={session.user.name || 'User'}
              width={32}
              height={32}
              className="w-full h-full rounded-lg object-cover"
            />
          ) : (
            <Text 
              variant="label-default-m" 
              onBackground="neutral-strong"
            >
              {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
            </Text>
          )}
        </Avatar>
        
        <Column gap="4">
          <Text 
            variant="label-default-m" 
            onBackground="neutral-strong"
          >
            {session?.user?.name || 'User'}
          </Text>
          <Text 
            variant="label-default-s" 
            onBackground="neutral-weak"
          >
            {session?.user?.email}
          </Text>
        </Column>
      </Row>
      
      <Line background="neutral-alpha-medium" />
      
      <Button
        fillWidth
        size="s"
        variant="secondary"
        radius="top-left"
        onClick={handleSignOut}
        prefixIcon="logOut"
      >
        Sign out
      </Button>
    </Column>
  );
}
