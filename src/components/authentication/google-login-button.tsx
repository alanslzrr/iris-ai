// src/components/authentication/google-login-button.tsx

'use client';

import { RevealFx } from '@once-ui-system/core';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export function GoogleLoginButton() {
  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <form action={'#'} className={'px-6 md:px-16 pb-6 py-8 gap-6 flex flex-col items-center justify-center'}>
      <RevealFx delay={0.02}>
        <div className="flex justify-center items-center w-full">
          <Image 
            src={'/assets/icons/logo/logo_no_name.png'} 
            alt={'IRIS AI'} 
            width={80} 
            height={80}
            style={{
              filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))',
              display: 'block',
              margin: '0 auto'
            }}
          />
        </div>
      </RevealFx>
      
      <RevealFx delay={0.05} translateY={0.3}>
        <div className="flex justify-center items-center w-full">
          <div 
            className={'text-[30px] leading-[36px] font-medium tracking-[-0.6px] text-center text-white'}
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
              display: 'block',
              margin: '0 auto'
            }}
          >
            Log in to your account
          </div>
        </div>
      </RevealFx>
      
      <RevealFx delay={0.08} translateY={0.3}>
        <Button 
          onClick={handleGoogleLogin} 
          type={'button'} 
          variant={'secondary'} 
          className={'w-full mt-6 flex items-center gap-3'}
          style={{
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.9) 0%, rgba(255, 152, 0, 0.8) 100%)',
            border: '1px solid rgba(244, 67, 54, 0.3)',
            boxShadow: '0 8px 32px rgba(244, 67, 54, 0.3)',
            color: '#ffffff',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
            e.currentTarget.style.boxShadow = '0 12px 40px rgba(244, 67, 54, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(244, 67, 54, 0.3)';
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </Button>
      </RevealFx>
      
      <RevealFx delay={0.1} translateY={0.5}>
        <div 
          className={'text-center text-white/70 text-sm mt-4 font-medium'}
          style={{
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
          }}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </div>
      </RevealFx>
    </form>
  );
} 