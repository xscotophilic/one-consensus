"use client";

import { WagmiProvider, http, createConfig } from "wagmi";
import type { Chain } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";
import * as wagmiChains from "wagmi/chains";

import { metaMask } from "wagmi/connectors";

const queryClient = new QueryClient();

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 1);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL ?? "";

let selectedChain: Chain | undefined = (Object.values(wagmiChains) as Chain[]).find(c => c.id === chainId);

if (!selectedChain) {
  console.warn(`Custom chain ID ${chainId} not found in wagmi/chains, falling back to defineChain.`);
  selectedChain = defineChain({
    id: chainId,
    name: `Chain-${chainId}`,
    network: `net-${chainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [rpcUrl] } },
    testnet: chainId !== 1,
  });
}

const chains = [selectedChain] as const;

const config = createConfig({
  chains,
  connectors: [metaMask()],
  transports: {
    [selectedChain.id]: http(rpcUrl),
  },
});

export default function Providers({
  children,
  configOverride,
}: {
  children: React.ReactNode;
  configOverride?: typeof config;
}) {
  return (
    <WagmiProvider config={configOverride || config} reconnectOnMount>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
