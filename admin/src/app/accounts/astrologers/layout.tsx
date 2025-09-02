import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Astrologers | True Astrotalk',
  description: 'Manage astrologers for True Astrotalk platform',
};

export default function AstrologersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}