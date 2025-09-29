
"use client";

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect, useWriteContract, useBalance, useConfig } from 'wagmi';
import { metaMask } from '@wagmi/connectors';
import { parseUnits, formatUnits } from 'viem';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions'
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


export function useWeb3Provider(): Web3ContextType {
  const { toast } = useToast();
  const { address, isConnected, isConnecting } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  const wagmiConfig = useConfig();
  
  const [transactionStates, setTransactionStates] = useState<Record<string, TransactionState>>({});
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const hasShownConnectToast = useRef(false);


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
    if (!isConnected) {
      connect({ connector: metaMask() });
    }
  };

  const disconnectWallet = () => {
    disconnect();
    setGameData(null); 
    hasShownConnectToast.current = false;
    toast({ title: "Wallet Disconnected" });
  };


  const { data: tokenBalanceData, refetch: refetchTokenBalance, isLoading: isTokenBalanceLoading } = useBalance({
    address,
    token: tokenAddress,
    query: {
        enabled: isConnected && !!address,
        refetchInterval: 30000,
    }
  });
  
  const tokenDecimals = 8;
  const tokenBalance = tokenBalanceData ? formatUnits(tokenBalanceData.value, tokenDecimals) : "0";

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

        const data: GameData = {
            playerBalance: parseFloat(formatUnits((gameDataResult as any)[0], tokenDecimals)),
            totalPool: parseFloat(formatUnits((gameDataResult as any)[1], tokenDecimals)),
            numberOfPlayers: Number((gameDataResult as any)[2]),
            minBet: parseFloat(formatUnits((gameDataResult as any)[3], tokenDecimals)),
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


  useEffect(() => {
    if (isConnected && address) {
      if (!hasShownConnectToast.current) {
          toast({ title: "Wallet Connected" });
          hasShownConnectToast.current = true;
      }
      getAIData(address);
      refetchTokenBalance();
    } else {
      setGameData(null);
      hasShownConnectToast.current = false;
    }
  }, [address, isConnected, getAIData, refetchTokenBalance]);


  const clearTransactionStatus = () => {
      setTransactionStatus({ action: null, status: null });
  };

  const refreshData = useCallback(async (): Promise<GameData | null> => {
    if(isDataFetching) return gameData;
    const freshGameData = await getAIData();
    await refetchTokenBalance();
    return freshGameData;
  }, [getAIData, refetchTokenBalance, isDataFetching, gameData]);


  const handleTransaction = async (action: string, functionName: string, args: any[] = [], options: { customToastTitle?: string; showSuccessToast?: boolean } = {}) => {
    const { customToastTitle, showSuccessToast = true } = options;

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
        let error: any = e;
        let reason = "An unknown error occurred.";

        // Find the revert reason
        let foundReason = false;
        while (error && !foundReason) {
            if (error.reason) {
                reason = error.reason;
                foundReason = true;
            } else if (error.cause) {
                error = error.cause;
            } else if (error.data && error.data.message) {
                 reason = error.data.message;
                 foundReason = true;
            } else if (error.shortMessage) {
                reason = error.shortMessage;
                foundReason = true;
            } else {
                error = null;
            }
        }
        
        // Specific check for user rejection
        if (reason.includes('User rejected the request') || reason.includes('denied transaction')) {
            toast({ variant: "destructive", title: "Transaction Rejected", description: "You rejected the transaction in your wallet." });
        } else {
            const finalReason = reason.replace('execution reverted: ', '');
            toast({ variant: "destructive", title: "Transaction Error", description: finalReason.charAt(0).toUpperCase() + finalReason.slice(1) });
        }
       
        setTransactionState(action, 'error');
        setTimeout(() => setTransactionState(action, 'idle'), 2000);
        throw new Error(reason); 
    }
  };

  const deposit = async (amount: number) => {
    if (amount <= 0) return toast({ variant: "destructive", title: "Invalid amount" });
    if (!address) return toast({ variant: "destructive", title: "Wallet not connected" });
    
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
        if (!e.message?.includes('User rejected the request') && !e.message?.includes('denied transaction')) {
           toast({ variant: "destructive", title: "Deposit Error", description: e.message || "An unknown error occurred during deposit." });
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
    const freshGameData = await refreshData();
    if (!freshGameData) {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch latest game data."});
        return;
    }
    
    if (freshGameData.playerBalance <= 0) {
        toast({ variant: "destructive", title: "No balance", description: "No balance to play with." });
        return;
    }

    if (freshGameData.playerBalance < freshGameData.minBet) {
        toast({ variant: "destructive", title: "Not enough funds", description: `You need at least ${freshGameData?.minBet} to play.`});
        return;
    }
    if (freshGameData.nextAvailableTime && (freshGameData.nextAvailableTime - Math.floor(Date.now() / 1000)) > 0) {
        toast({ variant: "destructive", title: "Cooldown", description: `Please wait for the cooldown to finish.`});
        return;
    }
    try {
      await handleTransaction('makeMeRich', 'makeMeRich', [], { showSuccessToast: false });
    } catch (error) {
    }
  };

  const isLoading = isConnecting || (isConnected && isTokenBalanceLoading && !gameData);

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

    
