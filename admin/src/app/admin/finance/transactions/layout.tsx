import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transactions | True Astrotalk',
  description: 'Manage transactions for True Astrotalk platform',
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}