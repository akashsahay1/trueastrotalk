import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Sessions | True Astrotalk',
  description: 'Manage video sessions for True Astrotalk platform',
};

export default function VideoSessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}