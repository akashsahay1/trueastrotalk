import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "Admin panel for True Astrotalk platform",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}