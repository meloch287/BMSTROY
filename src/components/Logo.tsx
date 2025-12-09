'use client';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ variant = 'icon', size = 'md', className = '' }: LogoProps) {
  // Using actual logo image - aspect ratio maintained
  const sizes = {
    sm: { width: 120, height: 40 },
    md: { width: 150, height: 50 },
    lg: { width: 180, height: 60 },
  };

  const { width, height } = sizes[size];

  return (
    <Link href="/" className={`inline-block transition-opacity hover:opacity-80 ${className}`}>
      <Image
        src="/logo/bmstroy-logo.png"
        alt="БМСТРОЙ МАСТЕР"
        width={width}
        height={height}
        priority
        style={{ width: 'auto', height: 'auto', maxWidth: width, maxHeight: height }}
      />
    </Link>
  );
}
