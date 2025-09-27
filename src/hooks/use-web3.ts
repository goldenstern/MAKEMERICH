"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useBalance, useWaitForTransactionReceipt, useAccountEffect } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseUnits, formatUnits } from 'viem';
import { gameABI } from '@/lib/abi';

export interface GameData {
  playerBalance: number;
  totalPool: number;
  numberOfPlayers: number;
  minBet: number;
  riskCoefficient: number;
}

interface TransactionStatus {
  action: string | null;
  status: 'pending' | 'confirmed' | 'error' | null;
}

export interface Web3ContextType {
  isConnected: boolean;
  address: `0x${string}` | undefined;
  formattedAddress: string | null;
  tokenBalance: string;
  tokenSymbol: string | undefined;
  gameData: GameData | null;
  isLoading: boolean;
  isDataFetching: boolean;
  actionLoading: Record<string, boolean>;
  transactionStatus: TransactionStatus;
  connectWallet: () => void;
  disconnectWallet: () => void;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  withdrawAll: () => Promise<void>;
  makeMeRich: () => Promise<void>;
  refreshData: () => void;
  clearTransactionStatus: () => void;
  contractAddress?: string;
  tokenAddress?: string;
}

export const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) || '0x';
const tokenAddress = (process.env.NEXT_PUBLIC_TOKEN_ADDRESS as `0x${string}`) || '0x';


export function useWeb3Provider(): Web3ContextType {
  const { toast } = useToast();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync, data: hash } = useWriteContract();
  
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ action: null, status: null });

  const { isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const setLoadingState = (action: string, state: boolean) => {
    setActionLoading(prev => ({ ...prev, [action]: state }));
  };

  const formattedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const connectWallet = () => {
    connect({ connector: injected() });
  };

  const disconnectWallet = () => {
      disconnect();
  };

  const { data: tokenBalanceData, refetch: refetchTokenBalance, isLoading: isTokenBalanceLoading, isFetching: isTokenBalanceFetching } = useBalance({
    address,
    token: tokenAddress,
    query: {
        enabled: isConnected && !!address,
        refetchInterval: 30000,
    }
  });
  
  const tokenDecimals = 8;
  const tokenBalance = tokenBalanceData ? formatUnits(tokenBalanceData.value, tokenDecimals) : "0";

    const { data: gameDataResult, isLoading: isGameDataLoading, isFetching: isGameDataFetching, refetch: refetchGameData, isError, error } = useReadContract({
    abi: gameABI,
    address: contractAddress,
    functionName: 'getGameData',
    args: [],
    account: address, 
    query: {
        enabled: isConnected && !!address,
        queryKey: ['getGameData', address], 
        refetchInterval: 30000,
    }
    });

  const gameData: GameData | null = gameDataResult ? {
    playerBalance: parseFloat(formatUnits((gameDataResult as any)[0], tokenDecimals)),
    totalPool: parseFloat(formatUnits((gameDataResult as any)[1], tokenDecimals)),
    numberOfPlayers: Number((gameDataResult as any)[2]),
    minBet: parseFloat(formatUnits((gameDataResult as any)[3], tokenDecimals)),
    riskCoefficient: 100 - Number((gameDataResult as any)[4]),
  } : null;

    useAccountEffect({
        onConnect: (data) => {
            toast({
                title: "Wallet Connected",
                description: `Welcome, ${data.address}`,
            });
            refetchGameData();
            refetchTokenBalance();
        },
        onDisconnect: () => {
            toast({
                title: "Wallet Disconnected",
            });
        },
    });

  useEffect(() => {
    if (isConfirmed && transactionStatus.action && transactionStatus.status === 'pending') {
      toast({ title: "Success", description: "Transaction confirmed." });
      setTransactionStatus(prev => ({ ...prev, status: 'confirmed' }));
      refetchGameData();
      refetchTokenBalance();
      // Reset only the specific action loading state after a delay to allow UI to update
      setTimeout(() => {
        setLoadingState(transactionStatus.action!, false);
      }, 500);
    }
  }, [isConfirmed, transactionStatus.action, transactionStatus.status, refetchGameData, refetchTokenBalance, toast]);

  const clearTransactionStatus = () => {
      setTransactionStatus({ action: null, status: null });
  };

  const refreshData = useCallback(() => {
    if(isGameDataFetching || isTokenBalanceFetching) return;
    refetchGameData();
    refetchTokenBalance();
  }, [refetchGameData, refetchTokenBalance, isGameDataFetching, isTokenBalanceFetching]);


  const handleTransaction = async (action: string, functionName: string, args: any[] = []) => {
    if (!isConnected) {
        toast({ variant: "destructive", title: "Error", description: "Wallet not connected." });
        return;
    }
    setLoadingState(action, true);
    setTransactionStatus({ action, status: 'pending' });
    try {
        await writeContractAsync({
            abi: gameABI,
            address: contractAddress,
            functionName,
            args,
        });
      toast({ title: "Transaction Sent", description: "Waiting for confirmation..." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Transaction Error", description: e.shortMessage || e.message });
      setLoadingState(action, false); 
      setTransactionStatus({ action, status: 'error' });
    }
  };

  const deposit = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Invalid amount" });
    const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
    
    setLoadingState('deposit', true);
    setTransactionStatus({ action: 'deposit', status: 'pending' });
    try {
        await writeContractAsync({
            abi: [ 
              {
                "constant": false,
                "inputs": [
                  { "name": "_spender", "type": "address" },
                  { "name": "_value", "type": "uint256" }
                ],
                "name": "approve",
                "outputs": [{ "name": "", "type": "bool" }],
                "type": "function"
              }
            ],
            address: tokenAddress,
            functionName: 'approve',
            args: [contractAddress, amountInUnits],
        });

        toast({ title: "Approving...", description: "Waiting for approval confirmation." });

        await new Promise(resolve => setTimeout(resolve, 15000));


        toast({ title: "Approved!", description: "Depositing tokens..." });

        await handleTransaction('deposit', 'deposit', [amountInUnits]);

    } catch (e: any) {
        console.error(e);
        toast({ variant: "destructive", title: "Deposit Error", description: e.shortMessage || e.message });
        setLoadingState('deposit', false);
        setTransactionStatus({ action: 'deposit', status: 'error' });
    }
  };

  const withdraw = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Invalid amount" });
    const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
    await handleTransaction('withdraw', 'withdraw', [amountInUnits]);
  };

  const withdrawAll = async () => {
    if (!gameData || gameData.playerBalance <= 0) return toast({ variant: "destructive", title: "No balance to withdraw" });
    await handleTransaction('withdrawAll', 'withdrawAll', []);
  };

  const makeMeRich = async () => {
    if (!gameData || gameData.playerBalance < gameData.minBet) {
        toast({ variant: "destructive", title: "Not enough funds", description: `You need at least ${gameData?.minBet} to play.`});
        return;
    }
    await handleTransaction('makeMeRich', 'makeMeRich', []);
  };

  const isLoading = isConnecting || (isConnected && isGameDataLoading && !gameDataResult);
  const isDataFetching = (isGameDataFetching || isTokenBalanceFetching);


  return {
    isConnected,
    address,
    formattedAddress,
    tokenBalance,
    tokenSymbol: tokenBalanceData?.symbol,
    gameData,
    isLoading,
    isDataFetching,
    actionLoading,
    transactionStatus,
    connectWallet,
    disconnectWallet,
    deposit,
    withdraw,
    withdrawAll,
    makeMeRich,
    refreshData,
    clearTransactionStatus,
    contractAddress,
    tokenAddress
  };
}
