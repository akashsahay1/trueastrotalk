import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wallets | True Astrotalk',
  description: 'Manage wallets for True Astrotalk platform',
};

export default function WalletsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}