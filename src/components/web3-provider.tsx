"use client";

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Web3Context, useWeb3Provider } from "@/hooks/use-web3";

// Получаем переменные окружения
const chainId = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111', 10);
const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org';

// Определяем кастомную сеть, если она не является стандартной
const customChain = defineChain({
  id: chainId,
  name: 'Custom Network',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
});

// Выбираем сеть
const selectedChain = chainId === mainnet.id ? mainnet : chainId === sepolia.id ? sepolia : customChain;

const config = createConfig({
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
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <Web3ProviderContent>
                    {children}
                </Web3ProviderContent>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
