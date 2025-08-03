import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Add User | True Astrotalk',
  description: 'Add new user to True Astrotalk platform',
};

export default function AddUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}