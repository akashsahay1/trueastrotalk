import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit User | True Astrotalk',
  description: 'Edit user details for True Astrotalk platform',
};

export default function EditUserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}