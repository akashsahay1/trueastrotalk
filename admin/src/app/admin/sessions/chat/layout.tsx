import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat Sessions | True Astrotalk',
  description: 'Manage chat sessions for True Astrotalk platform',
};

export default function ChatSessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}