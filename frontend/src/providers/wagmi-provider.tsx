"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { arbitrum, mainnet, optimism } from "wagmi/chains";

type Props = {
  children: ReactNode;
};

const config = createConfig({
  // Cast is required in this monorepo to avoid duplicate viem type-tree conflicts.
  chains: [mainnet, arbitrum, optimism] as any,
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
  } as any,
} as any);

export function AppWagmiProvider({ children }: Props) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
