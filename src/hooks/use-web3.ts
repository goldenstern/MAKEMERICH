"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from "@/hooks/use-toast";

interface GameData {
  playerBalance: number;
  totalPool: number;
  numberOfPlayers: number;
  minBet: number;
  riskCoefficient: number;
}

interface Web3ContextType {
  isConnected: boolean;
  address: string | null;
  formattedAddress: string | null;
  tokenBalance: number;
  gameData: GameData | null;
  isLoading: boolean;
  actionLoading: Record<string, boolean>;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  withdrawAll: () => Promise<void>;
  makeMeRich: () => Promise<void>;
  contractAddress?: string;
  tokenAddress?: string;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const Web3Provider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [formattedAddress, setFormattedAddress] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState(1000);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  
  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const setLoadingState = (action: string, state: boolean) => {
    setActionLoading(prev => ({ ...prev, [action]: state }));
  };
  
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setGameData(prevData => ({
      playerBalance: prevData?.playerBalance ?? 0,
      totalPool: 150000,
      numberOfPlayers: 42,
      minBet: 100,
      riskCoefficient: 5,
    }));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isConnected) {
      refreshData();
    } else {
      setGameData(null);
      setTokenBalance(1000);
    }
  }, [isConnected, refreshData]);

  const connectWallet = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockAddress = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    setAddress(mockAddress);
    setFormattedAddress(formatAddress(mockAddress));
    setIsConnected(true);
    setIsLoading(false);
    toast({
      title: "Wallet Connected",
      description: `Welcome, ${formatAddress(mockAddress)}`,
    });
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress(null);
    setFormattedAddress(null);
    toast({
      title: "Wallet Disconnected",
    });
  };
  
  const handleTransaction = async (action: string, amount: number, task: () => void) => {
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid Amount", description: "Please enter a positive amount." });
      return;
    }
    setLoadingState(action, true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    try {
      task();
      toast({ title: "Success", description: `Transaction successful.` });
      refreshData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Transaction Failed", description: e.message });
    } finally {
      setLoadingState(action, false);
    }
  };

  const deposit = async (amount: number) => {
    await handleTransaction('deposit', amount, () => {
        if (amount > tokenBalance) {
            throw new Error("Insufficient wallet balance.");
        }
        setTokenBalance(prev => prev - amount);
        setGameData(prev => prev ? { ...prev, playerBalance: prev.playerBalance + amount } : null);
    });
  };

  const withdraw = async (amount: number) => {
    await handleTransaction('withdraw', amount, () => {
        if (!gameData || amount > gameData.playerBalance) {
            throw new Error("Insufficient game balance.");
        }
        setTokenBalance(prev => prev + amount);
        setGameData(prev => prev ? { ...prev, playerBalance: prev.playerBalance - amount } : null);
    });
  };

  const withdrawAll = async () => {
    const amount = gameData?.playerBalance ?? 0;
    if (amount <= 0) {
        toast({ variant: "destructive", title: "No Balance to Withdraw", description: "Your game balance is zero." });
        return;
    }
    setLoadingState('withdrawAll', true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTokenBalance(prev => prev + amount);
    setGameData(prev => prev ? { ...prev, playerBalance: 0 } : null);
    toast({ title: "Success", description: "Withdrew all tokens from game balance." });
    setLoadingState('withdrawAll', false);
  };

  const makeMeRich = async () => {
    if (!gameData || gameData.playerBalance < gameData.minBet) {
      toast({ variant: "destructive", title: "Not enough funds", description: `You need at least ${gameData.minBet} tokens to play.` });
      return;
    }
    setLoadingState('makeMeRich', true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const isWin = Math.random() > 0.5;
    if (isWin) {
      const winnings = (gameData?.playerBalance ?? 0) * (gameData?.riskCoefficient ?? 2);
      setGameData(prev => prev ? { ...prev, playerBalance: prev.playerBalance + winnings } : null);
      toast({ title: "YOU WON!", description: `You won ${winnings.toLocaleString()} tokens! Feeling rich?` });
    } else {
      setGameData(prev => prev ? { ...prev, playerBalance: 0 } : null);
      toast({ variant: "destructive", title: "You Lost...", description: "Your balance went to zero. Better luck next time!" });
    }
    
    setLoadingState('makeMeRich', false);
  };

  const value = {
    isConnected,
    address,
    formattedAddress,
    tokenBalance,
    gameData,
    isLoading,
    actionLoading,
    connectWallet,
    disconnectWallet,
    deposit,
    withdraw,
    withdrawAll,
    makeMeRich,
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    tokenAddress: process.env.NEXT_PUBLIC_TOKEN_ADDRESS
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

// Wrap the GameUI with this provider
import GameUIComponent from '@/components/game-ui';

export default function GameUI() {
    return (
        <Web3Provider>
            <GameUIComponent />
        </Web3Provider>
    )
}
