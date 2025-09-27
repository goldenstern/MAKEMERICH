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
  connectWallet: () => void;
  disconnectWallet: () => void;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  withdrawAll: () => Promise<void>;
  makeMeRich: () => Promise<void>;
  refreshData: () => void;
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
    const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    })

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
                title: "Кошелек подключен",
                description: `Добро пожаловать, ${data.address}`,
            });
            refetchGameData();
            refetchTokenBalance();
        },
        onDisconnect: () => {
            toast({
                title: "Кошелек отключен",
            });
        },
    });

  useEffect(() => {
    if (isConfirmed) {
      toast({ title: "Успех", description: "Транзакция подтверждена." });
      refetchGameData();
      refetchTokenBalance();
      // Сбрасываем все состояния загрузки действий
      setActionLoading({});
    }
  }, [isConfirmed, refetchGameData, refetchTokenBalance, toast]);

  const refreshData = useCallback(() => {
    refetchGameData();
    refetchTokenBalance();
  }, [refetchGameData, refetchTokenBalance]);


  const handleTransaction = async (action: string, functionName: string, args: any[] = []) => {
    if (!isConnected) {
        toast({ variant: "destructive", title: "Ошибка", description: "Кошелек не подключен." });
        return;
    }
    setLoadingState(action, true);
    try {
        await writeContractAsync({
            abi: gameABI,
            address: contractAddress,
            functionName,
            args,
        });
      toast({ title: "Транзакция отправлена", description: "Ожидание подтверждения..." });
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Ошибка транзакции", description: e.shortMessage || e.message });
      setLoadingState(action, false); // Сбрасываем загрузку только при ошибке
    }
  };

  const deposit = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Неверная сумма" });
    const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
    
    setLoadingState('deposit', true);
    try {
        const approveTx = await writeContractAsync({
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

        toast({ title: "Подтверждение...", description: "Ожидание подтверждения права на списание." });

        // Не используем isConfirmed напрямую, а ждем чек
        // const receipt = await waitForTransactionReceipt({ hash: approveTx });

        // Вместо этого просто ждем
        await new Promise(resolve => setTimeout(resolve, 15000));


        toast({ title: "Подтверждено!", description: "Внесение токенов..." });

        await handleTransaction('deposit', 'deposit', [amountInUnits]);

    } catch (e: any) {
        console.error(e);
        toast({ variant: "destructive", title: "Ошибка депозита", description: e.shortMessage || e.message });
        setLoadingState('deposit', false);
    }
  };

  const withdraw = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Неверная сумма" });
    const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
    await handleTransaction('withdraw', 'withdraw', [amountInUnits]);
  };

  const withdrawAll = async () => {
    if (!gameData || gameData.playerBalance <= 0) return toast({ variant: "destructive", title: "Нет баланса для вывода" });
    await handleTransaction('withdrawAll', 'withdrawAll', []);
  };

  const makeMeRich = async () => {
    await handleTransaction('makeMeRich', 'makeMeRich', []);
  };

  const isLoading = isConnecting || (isConnected && (isGameDataLoading || isTokenBalanceLoading) && !gameDataResult);
  const isDataFetching = (isConnected && (isGameDataFetching || isTokenBalanceFetching));


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
    connectWallet,
    disconnectWallet,
    deposit,
    withdraw,
    withdrawAll,
    makeMeRich,
    refreshData,
    contractAddress,
    tokenAddress
  };
}
