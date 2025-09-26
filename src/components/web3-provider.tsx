"use client";

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3Context, useWeb3Provider } from "@/hooks/use-web3";

const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111', 10);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';

const customChain = defineChain({
  id: chainId,
  name: process.env.NEXT_PUBLIC_CHAIN_NAME || 'Custom Network',
  nativeCurrency: { 
    name: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME || 'Ether', 
    symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL || 'ETH', 
    decimals: parseInt(process.env.NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS || '18', 10) 
  },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Block Explorer', url: process.env.NEXT_PUBLIC_BLOCK_EXPLORER_URL || '' },
  }
});

const selectedChain = chainId === mainnet.id ? mainnet : chainId === sepolia.id ? sepolia : customChain;

const wagmiConfig = createConfig({
  chains: [selectedChain],
  transports: {
    [selectedChain.id]: http(),
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
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <Web3ProviderContent>
                    {children}
                </Web3ProviderContent>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
