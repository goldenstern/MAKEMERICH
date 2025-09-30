"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect, useWriteContract, useBalance, useConfig } from 'wagmi';
import { metaMask } from '@wagmi/connectors';
import { parseUnits, formatUnits, BaseError } from 'viem';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions'
import { gameABI } from '@/lib/abi';
import { ContractFunctionRevertedError, UserRejectedRequestError, TransactionExecutionError } from 'viem';

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
  refreshData: () => Promise<GameData | null>;
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
const MMR_PREV_BALANCE_KEY = "mmr-prev-balance";

export function useWeb3Provider(): Web3ContextType {
  const { toast } = useToast();
  const { address, isConnected, isConnecting, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect, disconnectAsync } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  const wagmiConfig = useConfig();
  
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [transactionStates, setTransactionStates] = useState<Record<string, TransactionState>>({});
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ action: null, status: null });
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const getAIData = useCallback(async (currentAddress?: `0x${string}`) => {
    const addressToUse = currentAddress || address;
    if (!addressToUse) return null;
    
    setIsDataFetching(true);
    try {
        const gameDataResult = await readContract(wagmiConfig, {
            abi: gameABI,
            address: contractAddress,
            functionName: 'getAIData',
            args: [],
            account: addressToUse,
        });

        const feePercentResult = await readContract(wagmiConfig, {
            abi: gameABI,
            address: contractAddress,
            functionName: 'feePercent',
            args: [],
            account: addressToUse,
        });

        const tokenDecimals = await readContract(wagmiConfig, {
          abi: gameABI,
          address: contractAddress,
          functionName: 'tokenDecimals',
        });


        const data: GameData = {
            playerBalance: parseFloat(formatUnits((gameDataResult as any)[0], tokenDecimals as number)),
            totalPool: parseFloat(formatUnits((gameDataResult as any)[1], tokenDecimals as number)),
            numberOfPlayers: Number((gameDataResult as any)[2]),
            minBet: parseFloat(formatUnits((gameDataResult as any)[3], tokenDecimals as number)),
            riskCoefficient: 100 - Number((gameDataResult as any)[4]),
            feePercent: feePercentResult ? Number(feePercentResult) : 3,
            nextAvailableTime: Number((gameDataResult as any)[6]),
        };
        setGameData(data);
        return data;
    } catch (e) {
        console.error("Error fetching game data:", e);
        setGameData(null);
        return null;
    } finally {
        setIsDataFetching(false);
    }
  }, [address, wagmiConfig]);
  
  const { data: tokenBalanceData, refetch: refetchTokenBalance, isLoading: isTokenBalanceLoading } = useBalance({
    address,
    token: tokenAddress,
    query: {
        enabled: isConnected && !!address,
        refetchInterval: 30000,
    }
  });

  useEffect(() => {
    if (isConnected && address) {
      getAIData(address);
      refetchTokenBalance();
    } else {
      // Clear data when disconnected
      setGameData(null);
    }
  }, [isConnected, address, getAIData, refetchTokenBalance]);
  
  const connectWallet = useCallback(() => {
    const metaMaskConnector = connectors.find(c => c.id === 'metaMask');
    connect({ connector: metaMaskConnector ?? connectors[0] });
  }, [connect, connectors]);

  const disconnectWallet = useCallback(async () => {
    // Forcefully clear all application state immediately
    setGameData(null);
    // Then, tell wagmi to disconnect
    await disconnectAsync();
    toast({ title: "Wallet Disconnected" });
  }, [disconnectAsync, toast]);


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
  
  const setLoadingState = (action: string, state: boolean) => {
    setActionLoading(prev => ({ ...prev, [action]: state }));
  };

  const formattedAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null;

  const [tokenDecimals, setTokenDecimals] = useState(8);

  useEffect(() => {
    const fetchDecimals = async () => {
        try {
            const decimals = await readContract(wagmiConfig, {
                abi: gameABI,
                address: contractAddress,
                functionName: 'tokenDecimals',
            });
            setTokenDecimals(decimals as number);
        } catch (error) {
            console.error("Failed to fetch token decimals", error);
        }
    };
    if (isConnected) {
        fetchDecimals();
    }
  }, [wagmiConfig, isConnected]);

  const tokenBalance = tokenBalanceData ? formatUnits(tokenBalanceData.value, tokenDecimals) : "0";

  const clearTransactionStatus = () => {
      setTransactionStatus({ action: null, status: null });
  };

  const refreshData = useCallback(async (): Promise<GameData | null> => {
    if(isDataFetching) return gameData;
    if (!isConnected || !address) return null;
    const freshGameData = await getAIData();
    await refetchTokenBalance();
    return freshGameData;
  }, [getAIData, refetchTokenBalance, isDataFetching, gameData, isConnected, address]);

  const handleTransaction = async (
    action: string, 
    functionName: string, 
    args: any[] = [], 
    options: { customToastTitle?: string; showSuccessToast?: boolean; gas?: bigint } = {}
  ) => {
    const { customToastTitle, showSuccessToast = true, gas } = options;

    if (!isConnected || !address) {
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
            account: address,
            gas,
        });
      setTransactionState(action, 'processing');
      toast({ title: customToastTitle || "Transaction Sent", description: "Waiting for confirmation..." });

      const receipt = await waitForTransactionReceipt(wagmiConfig, { hash: txHash });

      if (receipt.status !== 'success') {
          throw new Error("Transaction failed.");
      }

      if (showSuccessToast) {
        toast({ title: "Success", description: "Transaction confirmed." });
      }
      setTransactionState(action, 'done');
      setTransactionStatus({ action, status: 'confirmed' });
      await refreshData();

    } catch (e: any) {
        let reason = "An unknown error occurred.";
        
        if (e instanceof BaseError) {
          const userRejectedError = e.walk((err) => err instanceof UserRejectedRequestError);
          const revertError = e.walk((err) => err instanceof ContractFunctionRevertedError);
          const txError = e.walk((err) => err instanceof TransactionExecutionError);

          if (userRejectedError) {
            reason = "User rejected the request";
          } else if (revertError instanceof ContractFunctionRevertedError) {
             reason = revertError.reason ?? "An unknown contract error occurred.";
          } else if (txError instanceof TransactionExecutionError) {
             // This is where "out of gas" and other execution errors are caught.
             // We access `cause` to get the real underlying error.
             reason = txError.cause?.message || txError.shortMessage || "Transaction execution error.";
          } else {
             reason = e.shortMessage;
          }
        }
        
        const finalReason = reason.charAt(0).toUpperCase() + reason.slice(1).replace('execution reverted: ', '');
        toast({ variant: "destructive", title: "Transaction Error", description: finalReason });
       
        setTransactionState(action, 'error');
        setTimeout(() => setTransactionState(action, 'idle'), 2000);
        throw new Error(reason); 
    }
  };

  const deposit = async (amount: number) => {
    if (!isConnected || !address) {
      toast({ variant: "destructive", title: "Error", description: "Wallet not connected." });
      return;
    }
    if (amount <= 0) return toast({ variant: "destructive", title: "Invalid amount" });
    
    const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
    
    setLoadingState('deposit', true);
    setTransactionState('deposit', 'awaiting_confirmation');

    try {
        toast({ title: "Approving...", description: "Please confirm the transaction in your wallet." });

        const approveTxHash = await writeContractAsync({
            abi: [ 
              { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
            ],
            address: tokenAddress,
            functionName: 'approve',
            args: [contractAddress, amountInUnits],
            account: address,
        });
        
        setTransactionState('deposit', 'processing');
        toast({ title: "Approval Sent", description: "Waiting for confirmation..." });

        const approveReceipt = await waitForTransactionReceipt(wagmiConfig, {
            hash: approveTxHash,
        });

        if (approveReceipt.status !== 'success') {
          throw new Error("Approval transaction failed.");
        }

        toast({ title: "Approved!", description: "Staking tokens..." });

        await handleTransaction('deposit', 'deposit', [amountInUnits], { customToastTitle: "Staking..." });
        setTransactionState('deposit', 'done');

    } catch (e: any) {
        if (!(e instanceof Error && e.message.includes("User rejected the request"))) {
            if (e instanceof BaseError) {
                const reason = e.shortMessage || e.message;
                toast({ variant: "destructive", title: "Deposit Error", description: reason });
            } else {
                toast({ variant: "destructive", title: "Deposit Error", description: "An unknown error occurred during deposit." });
            }
        }
        setTransactionState('deposit', 'error');
    } finally {
        setLoadingState('deposit', false);
        setTimeout(() => setTransactionState('deposit', 'idle'), 2000);
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
    } finally {
      setLoadingState('withdrawAll', false);
    }
  };

  const makeMeRich = async () => {
    if (!gameData) {
      toast({ variant: "destructive", title: "Error", description: "Game data not loaded." });
      return;
    }
     if (gameData.playerBalance < gameData.minBet) {
       toast({ variant: "destructive", title: "Not enough funds", description: `You need at least ${gameData.minBet} to play.` });
       return;
    }

    try {
      localStorage.setItem(MMR_PREV_BALANCE_KEY, gameData.playerBalance.toString());
      await handleTransaction(
        'makeMeRich', 
        'makeMeRich', 
        [], 
        { 
          showSuccessToast: false,
          gas: 250000n,
        }
      );
    } catch (error) {
      localStorage.removeItem(MMR_PREV_BALANCE_KEY);
    }
  };

  const isLoading = isConnecting || (isConnected && (isTokenBalanceLoading || !gameData));

  return {
    isConnected: isConnected,
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
