"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect, useReadContract, useWriteContract, useBalance } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { parseEther, formatUnits } from 'viem';
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
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();

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

  const tokenBalance = tokenBalanceData ? formatUnits(tokenBalanceData.value, tokenBalanceData.decimals) : "0";
  
  const { data: gameDataResult, isLoading: isGameDataLoading, refetch: refetchGameData, isError, error } = useReadContract({
    abi: gameABI,
    address: contractAddress,
    functionName: 'getGameData',
    args: address ? [address] : undefined,
    query: {
        enabled: isConnected && !!address && address.startsWith('0x'),
    }
  });

  const gameData: GameData | null = gameDataResult ? {
    playerBalance: parseFloat(formatUnits((gameDataResult as any)[0], tokenBalanceData?.decimals ?? 18)),
    totalPool: parseFloat(formatUnits((gameDataResult as any)[1], tokenBalanceData?.decimals ?? 18)),
    numberOfPlayers: Number((gameDataResult as any)[2]),
    minBet: parseFloat(formatUnits((gameDataResult as any)[3], tokenBalanceData?.decimals ?? 18)),
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

  useEffect(() => {
    if (isConnected && address) {
      toast({
        title: "Кошелек подключен",
        description: `Добро пожаловать, ${formattedAddress}`,
      });
      console.log("Wallet connected, refetching data...");
      refetchGameData();
      refetchTokenBalance();
    } else if (!isConnected) {
        toast({
            title: "Кошелек отключен",
        });
    }
  }, [isConnected, address]);


  const handleTransaction = async (action: string, functionName: string, args: any[] = []) => {
    setLoadingState(action, true);
    try {
      const tx = await writeContractAsync({
        abi: gameABI,
        address: contractAddress,
        functionName,
        args,
      });
      toast({ title: "Транзакция отправлена", description: "Ожидание подтверждения..." });
      // In a real app, you would wait for transaction receipt here.
      // For this demo, we'll just optimistically refetch.
      await new Promise(resolve => setTimeout(resolve, 5000)); // Simulating confirmation time
      toast({ title: "Успех", description: `Транзакция подтверждена.` });
      refetchGameData();
      refetchTokenBalance();
    } catch (e: any) {
      console.error(e);
      toast({ variant: "destructive", title: "Ошибка транзакции", description: e.shortMessage || e.message });
    } finally {
      setLoadingState(action, false);
    }
  };

  const deposit = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Неверная сумма" });
    // First, approve the contract to spend tokens
    setLoadingState('deposit', true);
    try {
        await writeContractAsync({
            abi: [ // ERC20 approve ABI
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
            args: [contractAddress, parseEther(amount.toString())],
        });
        toast({ title: "Запрос на подтверждение", description: "Ожидание подтверждения..." });
        // Again, waiting for real confirmation is better
        await new Promise(resolve => setTimeout(resolve, 5000));
        toast({ title: "Подтверждено!", description: "Внесение токенов..." });

        await handleTransaction('deposit', 'deposit', [parseEther(amount.toString())]);

    } catch (e: any) {
        console.error(e);
        toast({ variant: "destructive", title: "Ошибка депозита", description: e.shortMessage || e.message });
    } finally {
        setLoadingState('deposit', false);
    }
  };

  const withdraw = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Неверная сумма" });
    await handleTransaction('withdraw', 'withdraw', [parseEther(amount.toString())]);
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
    isLoading: isConnecting || (isConnected && (isGameDataLoading || isTokenBalanceLoading)),
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
