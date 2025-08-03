import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | True Astrotalk',
  description: 'Admin login for True Astrotalk platform',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}