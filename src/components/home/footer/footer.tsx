// src/components/home/footer/footer.tsx

import { BuiltUsingTools } from '@/components/home/footer/built-using-tools';
import Image from 'next/image';
import Link from 'next/link';

export function Footer() {
  return (
    <>
      <BuiltUsingTools />
      <footer className="mx-auto max-w-7xl px-8 pb-16 pt-8 text-sm text-neutral-300 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Link href={'/'} className="flex items-center">
              <Image className="w-auto block" src="/logo_phoenix_blanco.png" width={120} height={28} alt="IRIS AI" />
            </Link>
            <span className="text-neutral-400">IRIS AI</span>
          </div>
          <div className="flex items-center gap-6 text-neutral-400">
            <span>© {new Date().getFullYear()} Phoenix Calibration</span>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
