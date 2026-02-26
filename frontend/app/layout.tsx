import "./globals.css";
import type { Metadata } from "next";
import { AppWagmiProvider } from "../src/providers/wagmi-provider";

export const metadata: Metadata = {
  title: "CERTLAYER",
  description: "Trustless event verification and automated enforcement for web3 infrastructure.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppWagmiProvider>{children}</AppWagmiProvider>
      </body>
    </html>
  );
}
