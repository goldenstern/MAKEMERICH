"use client";

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { bsc } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3Context, useWeb3Provider } from "@/hooks/use-web3";
import { metaMask } from '@wagmi/connectors';

// Create a client
const queryClient = new QueryClient();

const config = createConfig({
  chains: [bsc],
  connectors: [
    metaMask({
      dappMetadata: {
        name: 'MakeMeRich, AI',
        url: 'https://mmr.angl.money',
      },
    }),
  ],
  transports: {
    [bsc.id]: http(),
  },
  // This helps with ensuring consistent disconnect/reconnect behavior
  reconnectOnMount: true, 
});

const Web3ProviderContent = ({ children }: { children: React.ReactNode }) => {
    const value = useWeb3Provider();
    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
}

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <Web3ProviderContent>
                    {children}
                </Web3ProviderContent>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
