import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CertLayer",
  description: "Trustless event verification and automated enforcement for web3 infrastructure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
