import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Administrators | True Astrotalk',
  description: 'Manage admins for True Astrotalk platform',
};

export default function AdminsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}