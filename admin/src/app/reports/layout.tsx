import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reports | True Astrotalk',
  description: 'Admin reports for True Astrotalk platform',
};

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}