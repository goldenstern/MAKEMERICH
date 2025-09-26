"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useBalance, useWaitForTransactionReceipt } from 'wagmi';
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
  actionLoading: Record<string, boolean>;
  connectWallet: () => void;
  disconnectWallet: () => void;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  withdrawAll: () => Promise<void>;
  makeMeRich: () => Promise<void>;
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
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ 
    hash: txHash,
  });

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const setLoadingState = (action: string, state: boolean) => {
    setActionLoading(prev => ({ ...prev, [action]: state }));
  };

  const formattedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const { data: tokenBalanceData, refetch: refetchTokenBalance, isLoading: isTokenBalanceLoading } = useBalance({
    address,
    token: tokenAddress,
    query: {
        enabled: isConnected && !!address,
    }
  });
  
  const tokenDecimals = tokenBalanceData?.decimals ?? 18;
  const tokenBalance = tokenBalanceData ? formatUnits(tokenBalanceData.value, tokenDecimals) : "0";

  const { data: gameDataResult, isLoading: isGameDataLoading, refetch: refetchGameData, isError, error } = useReadContract({
    abi: gameABI,
    address: contractAddress,
    functionName: 'getGameData',
    query: {
        enabled: isConnected,
    }
  });

  const { data: playerContractData, isLoading: isPlayerBalanceLoading, refetch: refetchPlayerBalance } = useReadContract({
      abi: gameABI,
      address: contractAddress,
      functionName: 'players',
      args: address ? [address] : undefined,
      query: {
          enabled: isConnected && !!address,
      }
  });

  const gameData: GameData | null = gameDataResult ? {
    playerBalance: playerContractData ? parseFloat(formatUnits((playerContractData as any)[0], tokenDecimals)) : 0,
    totalPool: parseFloat(formatUnits((gameDataResult as any)[1], tokenDecimals)),
    numberOfPlayers: Number((gameDataResult as any)[2]),
    minBet: parseFloat(formatUnits((gameDataResult as any)[3], tokenDecimals)),
    riskCoefficient: Number((gameDataResult as any)[4]),
  } : null;


  useEffect(() => {
    console.log("--- DEBUG: Token Balance ---");
    console.log("Is Loading:", isTokenBalanceLoading);
    console.log("Raw Data:", tokenBalanceData);
    console.log("Parsed Balance:", tokenBalance);
    console.log("--------------------------");
  }, [tokenBalanceData, isTokenBalanceLoading, tokenBalance]);

  useEffect(() => {
    console.log("--- DEBUG: Game Data ---");
    console.log("Is Loading:", isGameDataLoading);
    console.log("Is Error:", isError);
    if (isError) {
        console.error("Game Data Error:", error);
    }
    console.log("Raw Data:", gameDataResult);
    console.log("Parsed Data:", gameData);
    console.log("------------------------");
  }, [gameDataResult, isGameDataLoading, isError, error, gameData]);


  const connectWallet = () => {
    connect({ connector: injected() });
  };

  const disconnectWallet = () => {
    disconnect();
  };
  
  const refreshAllData = useCallback(() => {
    refetchGameData();
    refetchTokenBalance();
    refetchPlayerBalance();
  }, [refetchGameData, refetchTokenBalance, refetchPlayerBalance]);

  useEffect(() => {
    if (isConnected && address) {
      toast({
        title: "Кошелек подключен",
        description: `Добро пожаловать, ${formattedAddress}`,
      });
      console.log("Wallet connected, refetching data...");
      refreshAllData();
    } else if (!isConnected) {
        toast({
            title: "Кошелек отключен",
        });
    }
  }, [isConnected, address, formattedAddress, refreshAllData]);

  useEffect(() => {
    if (isConfirming) {
        toast({ title: "Транзакция отправлена", description: "Ожидание подтверждения..." });
    }
    if (isConfirmed) {
        toast({ title: "Успех", description: `Транзакция подтверждена.` });
        refreshAllData();
        setTxHash(undefined);
    }
  }, [isConfirming, isConfirmed, refreshAllData, toast]);


  const handleTransaction = async (action: string, functionName: string, args: any[] = []) => {
    setLoadingState(action, true);
    try {
      const hash = await writeContractAsync({
        abi: gameABI,
        address: contractAddress,
        functionName,
        args,
      });
      setTxHash(hash);
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Ошибка транзакции", description: e.shortMessage || e.message });
    } finally {
      setLoadingState(action, false);
    }
  };

  const deposit = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Неверная сумма" });
    const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
    
    setLoadingState('deposit', true);
    try {
        const approveHash = await writeContractAsync({
            abi: [ 
              {
                "inputs": [
                  { "name": "spender", "type": "address" },
                  { "name": "amount", "type": "uint256" }
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
        
        toast({ title: "Запрос на подтверждение", description: "Ожидание подтверждения..." });

        const receipt = await (useWaitForTransactionReceipt as any).promise({ hash: approveHash });

        if (receipt.status === 'success') {
            toast({ title: "Подтверждено!", description: "Внесение токенов..." });
            await handleTransaction('deposit', 'deposit', [amountInUnits]);
        } else {
             toast({ variant: "destructive", title: "Ошибка подтверждения", description: "Транзакция отклонена" });
        }

    } catch (e: any) {
        console.error(e);
        toast({ variant: "destructive", title: "Ошибка депозита", description: e.shortMessage || e.message });
    } finally {
       setLoadingState('deposit', false);
    }
  };

  const withdraw = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Неверная сумма" });
    if (!gameData || amount > gameData.playerBalance) return toast({ variant: "destructive", title: "Недостаточно средств" });
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

  return {
    isConnected,
    address,
    formattedAddress,
    tokenBalance,
    tokenSymbol: tokenBalanceData?.symbol,
    gameData,
    isLoading: isConnecting || (isConnected && (isGameDataLoading || isTokenBalanceLoading || isPlayerBalanceLoading)),
    actionLoading,
    connectWallet,
    disconnectWallet,
    deposit,
    withdraw,
    withdrawAll,
    makeMeRich,
    contractAddress,
    tokenAddress
  };
}
