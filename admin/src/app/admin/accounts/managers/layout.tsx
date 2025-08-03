import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Managers | True Astrotalk',
  description: 'Manage managers for True Astrotalk platform',
};

export default function ManagersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}