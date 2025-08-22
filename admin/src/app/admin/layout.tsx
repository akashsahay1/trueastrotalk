'use client';

import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Don't render anything if on login page (login page handles its own layout)
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Authentication is handled by middleware.ts
  return <>{children}</>;
}