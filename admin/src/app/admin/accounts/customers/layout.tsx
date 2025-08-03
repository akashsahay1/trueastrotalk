import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Customers | True Astrotalk',
  description: 'Manage customers for True Astrotalk platform',
};

export default function CustomersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}