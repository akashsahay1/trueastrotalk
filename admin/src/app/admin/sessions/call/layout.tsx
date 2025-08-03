import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Call Sessions | True Astrotalk',
  description: 'Manage call sessions for True Astrotalk platform',
};

export default function CallSessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}