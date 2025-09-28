"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useBalance, useAccountEffect, useConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseUnits, formatUnits } from 'viem';
import { waitForTransactionReceipt } from 'wagmi/actions'
import { gameABI } from '@/lib/abi';

export interface GameData {
  playerBalance: number;
  totalPool: number;
  numberOfPlayers: number;
  minBet: number;
  riskCoefficient: number;
  feePercent: number;
  nextAvailableTime: number;
}

type TransactionStage = 'idle' | 'awaiting_confirmation' | 'processing' | 'done' | 'error';

interface TransactionState {
  isActive: boolean;
  stage: TransactionStage;
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
  getTransactionState: (action: string) => TransactionState;
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
  const { writeContractAsync, data: hash, reset } = useWriteContract();
  const wagmiConfig = useConfig();
  
  const [transactionStates, setTransactionStates] = useState<Record<string, TransactionState>>({});

  const setTransactionState = (action: string, stage: TransactionStage) => {
    setTransactionStates(prev => ({
      ...prev,
      [action]: {
        isActive: stage !== 'idle' && stage !== 'done' && stage !== 'error',
        stage,
      }
    }));
  };

  const getTransactionState = (action: string): TransactionState => {
    return transactionStates[action] || { isActive: false, stage: 'idle' };
  };
  
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ action: null, status: null });
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

    const { data: gameDataResult, isLoading: isGameDataLoading, isFetching: isGameDataFetching, refetch: refetchGameData } = useReadContract({
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

  const { data: feePercentResult, refetch: refetchFeePercent } = useReadContract({
    abi: gameABI,
    address: contractAddress,
    functionName: 'feePercent',
    args: [],
    account: address,
    query: {
      enabled: isConnected && !!address,
      queryKey: ['feePercent', address],
      refetchInterval: 30000,
    },
  });

  const gameData: GameData | null = gameDataResult ? {
    playerBalance: parseFloat(formatUnits((gameDataResult as any)[0], tokenDecimals)),
    totalPool: parseFloat(formatUnits((gameDataResult as any)[1], tokenDecimals)),
    numberOfPlayers: Number((gameDataResult as any)[2]),
    minBet: parseFloat(formatUnits((gameDataResult as any)[3], tokenDecimals)),
    riskCoefficient: 100 - Number((gameDataResult as any)[4]),
    feePercent: feePercentResult ? Number(feePercentResult) : 3,
    nextAvailableTime: Number((gameDataResult as any)[6]),
  } : null;

    useAccountEffect({
        onConnect: (data) => {
            toast({
                title: "Wallet Connected",
                description: `Welcome, ${data.address}`,
            });
            refetchGameData();
            refetchTokenBalance();
            refetchFeePercent();
        },
        onDisconnect: () => {
            toast({
                title: "Wallet Disconnected",
            });
        },
    });

  const clearTransactionStatus = () => {
      setTransactionStatus({ action: null, status: null });
      reset();
  };

  const refreshData = useCallback(() => {
    if(isGameDataFetching || isTokenBalanceFetching) return;
    refetchGameData();
    refetchTokenBalance();
    refetchFeePercent();
  }, [refetchGameData, refetchTokenBalance, refetchFeePercent, isGameDataFetching, isTokenBalanceFetching]);


  const handleTransaction = async (action: string, functionName: string, args: any[] = [], customToastTitle?: string) => {
    if (!isConnected) {
        toast({ variant: "destructive", title: "Error", description: "Wallet not connected." });
        return;
    }
    setTransactionState(action, 'awaiting_confirmation');
    try {
        const txHash = await writeContractAsync({
            abi: gameABI,
            address: contractAddress,
            functionName,
            args,
        });
      setTransactionState(action, 'processing');
      toast({ title: customToastTitle || "Transaction Sent", description: "Waiting for confirmation..." });

      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

      if (receipt.status !== 'success') {
          throw new Error("Transaction failed.");
      }

      toast({ title: "Success", description: "Transaction confirmed." });
      setTransactionState(action, 'done');
      setTransactionStatus({ action, status: 'confirmed' });
      refreshData();

    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Transaction Error", description: e.shortMessage || e.message });
      setTransactionState(action, 'error');
      // Reset state after a short delay to allow user to see the error state
      setTimeout(() => setTransactionState(action, 'idle'), 2000);
      throw e; // re-throw to be caught by caller
    }
  };

  const deposit = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Invalid amount" });
    const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
    
    setLoadingState('deposit', true);

    try {
        toast({ title: "Approving...", description: "Please confirm the transaction in your wallet." });

        const approveTxHash = await writeContractAsync({
            abi: [ 
              { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
            ],
            address: tokenAddress,
            functionName: 'approve',
            args: [contractAddress, amountInUnits],
        });
        
        toast({ title: "Approval Sent", description: "Waiting for confirmation..." });

        const approveReceipt = await waitForTransactionReceipt(wagmiConfig, {
            hash: approveTxHash,
        });

        if (approveReceipt.status !== 'success') {
          throw new Error("Approval transaction failed.");
        }

        toast({ title: "Approved!", description: "Depositing tokens..." });

        await handleTransaction('deposit', 'deposit', [amountInUnits], "Depositing...");

    } catch (e: any) {
        console.error(e);
        toast({ variant: "destructive", title: "Deposit Error", description: e.shortMessage || e.message });
    } finally {
        setLoadingState('deposit', false);
    }
  };

  const withdraw = async (amount: number) => {
    if (amount <= 0) {
      toast({ variant: "destructive", title: "Invalid amount" });
      return;
    }
    setLoadingState('withdraw', true);
    try {
      const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
      await handleTransaction('withdraw', 'withdraw', [amountInUnits]);
    } catch (error) {
       // Error is already handled in handleTransaction
    } finally {
        setLoadingState('withdraw', false);
    }
  };

  const withdrawAll = async () => {
    if (!gameData || gameData.playerBalance <= 0) {
      toast({ variant: "destructive", title: "No balance to withdraw" });
      return;
    }
     setLoadingState('withdrawAll', true);
    try {
      await handleTransaction('withdrawAll', 'withdrawAll', []);
    } catch (error) {
       // Error is already handled in handleTransaction
    } finally {
      setLoadingState('withdrawAll', false);
    }
  };

  const makeMeRich = async () => {
    if (!gameData || gameData.playerBalance < gameData.minBet) {
        toast({ variant: "destructive", title: "Not enough funds", description: `You need at least ${gameData?.minBet} to play.`});
        return;
    }
    if (gameData.nextAvailableTime && (gameData.nextAvailableTime - Math.floor(Date.now() / 1000)) > 0) {
        toast({ variant: "destructive", title: "Cooldown", description: `Please wait for the cooldown to finish.`});
        return;
    }
    try {
      await handleTransaction('makeMeRich', 'makeMeRich', []);
    } catch (error) {
      // Error is already handled in handleTransaction
    }
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
    getTransactionState,
    contractAddress,
    tokenAddress
  };
}
