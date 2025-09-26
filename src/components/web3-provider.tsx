"use client";

import { Web3Context, useWeb3Provider } from "@/hooks/use-web3";

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
    const value = useWeb3Provider();
    return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}