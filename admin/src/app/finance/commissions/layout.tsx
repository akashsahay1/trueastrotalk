import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Commissions | True Astrotalk',
  description: 'Manage astrologer commissions for True Astrotalk platform',
};

export default function CommissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}