"use client";

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3Context, useWeb3Provider } from "@/hooks/use-web3";

const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

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