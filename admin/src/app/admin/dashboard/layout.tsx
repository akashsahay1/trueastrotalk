import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | True Astrotalk',
  description: 'Admin dashboard for True Astrotalk platform',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}