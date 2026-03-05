import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kistly - Installment Management Made Easy",
  description: "Manage installment plans and payments effortlessly. Perfect for SMBs and retailers.",
};

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
