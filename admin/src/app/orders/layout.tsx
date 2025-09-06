import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders Management | True Astrotalk',
  description: 'Manage customer orders for True Astrotalk platform',
};

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}