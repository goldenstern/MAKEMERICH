"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect, useWriteContract, useBalance, useConfig, useSwitchChain } from 'wagmi';
import { watchAccount } from 'wagmi/actions';
import { metaMask } from '@wagmi/connectors';
import { bsc } from 'wagmi/chains';
import { parseUnits, formatUnits, BaseError } from 'viem';
import { waitForTransactionReceipt, readContract } from 'wagmi/actions'
import { systemABI } from '@/lib/abi';
import { ContractFunctionRevertedError, UserRejectedRequestError, TransactionExecutionError, SwitchChainError } from 'viem';
import { ActionType } from '@/components/particle-sphere';

export interface SystemData {
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
  isWrongNetwork: boolean;
  address: `0x${string}` | undefined;
  formattedAddress: string | null;
  tokenBalance: string;
  tokenSymbol: string | undefined;
  systemData: SystemData | null;
  isLoading: boolean;
  isDataFetching: boolean;
  isDisconnecting: boolean;
  actionLoading: Record<string, boolean>;
  transactionStatus: TransactionStatus;
  lastAction: ActionType;
  isTutorialOpen: boolean;
  setIsTutorialOpen: (open: boolean) => void;
  openTutorial: () => void;
  connectWallet: () => void;
  disconnectWallet: () => void;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  withdrawAll: () => Promise<void>;
  makeMeRich: () => Promise<void>;
  refreshData: () => Promise<SystemData | null>;
  clearTransactionStatus: () => void;
  getTransactionState: (action: string) => TransactionState;
  setLastAction: (action: ActionType) => void;
  clearLastAction: () => void;
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
  const { disconnectAsync } = useDisconnect();
  const { writeContractAsync } = useWriteContract();
  const wagmiConfig = useConfig();
  const { switchChain } = useSwitchChain();
  
  const [systemData, setSystemData] = useState<SystemData | null>(null);
  const [isDataFetching, setIsDataFetching] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [transactionStates, setTransactionStates] = useState<Record<string, TransactionState>>({});
  const [transactionStatus, setTransactionStatus] = useState<TransactionStatus>({ action: null, status: null });
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [lastAction, setLastAction] = useState<ActionType>(null);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  
  const targetChainId = wagmiConfig.chains[0]?.id;
  const isWrongNetwork = isConnected && chainId !== targetChainId;

  const getAIData = useCallback(async (currentAddress?: `0x${string}`) => {
    const addressToUse = currentAddress || address;
    if (!addressToUse) return null;
    
    setIsDataFetching(true);
    try {
        const systemDataResult = await readContract(wagmiConfig, {
            abi: systemABI,
            address: contractAddress,
            functionName: 'getAIData',
            args: [],
            account: addressToUse,
        });

        const feePercentResult = await readContract(wagmiConfig, {
            abi: systemABI,
            address: contractAddress,
            functionName: 'feePercent',
            args: [],
            account: addressToUse,
        });

        const tokenDecimals = await readContract(wagmiConfig, {
          abi: systemABI,
          address: contractAddress,
          functionName: 'tokenDecimals',
        });


        const data: SystemData = {
            playerBalance: parseFloat(formatUnits((systemDataResult as any)[0], tokenDecimals as number)),
            totalPool: parseFloat(formatUnits((systemDataResult as any)[1], tokenDecimals as number)),
            numberOfPlayers: Number((systemDataResult as any)[2]),
            minBet: parseFloat(formatUnits((systemDataResult as any)[3], tokenDecimals as number)),
            riskCoefficient: 100 - Number((systemDataResult as any)[4]),
            feePercent: feePercentResult ? Number(feePercentResult) : 3,
            nextAvailableTime: Number((systemDataResult as any)[6]),
        };
        setSystemData(data);
        return data;
    } catch (e) {
        console.error("Error fetching system data:", e);
        setSystemData(null);
        return null;
    } finally {
        setIsDataFetching(false);
    }
  }, [address, wagmiConfig]);
  
  const { data: tokenBalanceData, refetch: refetchTokenBalance, isLoading: isTokenBalanceLoading } = useBalance({
    address,
    token: tokenAddress,
    query: {
        enabled: isConnected && !!address && !isWrongNetwork,
    }
  });

  const refreshData = useCallback(async (): Promise<SystemData | null> => {
    if(isDataFetching) return systemData;
    if (!isConnected || !address || isWrongNetwork) return null;
    const freshSystemData = await getAIData();
    await refetchTokenBalance();
    return freshSystemData;
  }, [getAIData, refetchTokenBalance, isDataFetching, systemData, isConnected, address, isWrongNetwork]);


  useEffect(() => {
    if (isConnected && address && !isDataFetching && !systemData) {
      refreshData();
    }
  }, [address, isConnected, isDataFetching, systemData, refreshData]);

  useEffect(() => {
    const unwatch = watchAccount(wagmiConfig, {
      onChange(account) {
        if (account.isConnected && account.address) {
          if(account.chainId !== targetChainId) {
             setSystemData(null);
          } else {
             refreshData();
          }
        } else {
          setSystemData(null);
        }
      },
    });

    return () => unwatch();
  }, [wagmiConfig, refreshData, targetChainId]);

  
  const connectWallet = useCallback(async () => {
    const metaMaskConnector = connectors.find(c => c.id === 'metaMask');
    try {
        await connect({ connector: metaMaskConnector ?? connectors[0], options: { eip6963: true } });
    } catch (error) {
        if (error instanceof UserRejectedRequestError) {
             toast({ variant: "destructive", title: "Connection Rejected", description: "You rejected the connection request in your wallet." });
        } else {
             toast({ variant: "destructive", title: "Connection Failed", description: "Failed to connect to wallet. Please try again." });
        }
        console.error("Connection failed", error);
    }
  }, [connect, connectors, toast]);

  const disconnectWallet = useCallback(async () => {
    setIsDisconnecting(true);
    setSystemData(null);
    await disconnectAsync();
    toast({ title: "Wallet Disconnected" });
    setIsDisconnecting(false);
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
                abi: systemABI,
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
  
  const clearLastAction = () => {
    setLastAction(null);
  };
  
  const openTutorial = () => {
    setIsTutorialOpen(true);
  };


  const handleTransaction = async (
    action: string, 
    functionName: string, 
    args: any[] = [], 
    options: { customToastTitle?: string; showSuccessToast?: boolean; gas?: bigint, actionType?: ActionType } = {}
  ) => {
    const { customToastTitle, showSuccessToast = true, gas, actionType } = options;

    if (!isConnected || !address) {
      const errorMsg = "Wallet not connected.";
      toast({ variant: "destructive", title: "Error", description: errorMsg });
      throw new Error(errorMsg);
    }

    if (isWrongNetwork) {
        toast({ variant: "destructive", title: "Wrong Network", description: `Please switch to ${wagmiConfig.chains[0].name} to perform this action.` });
        if(targetChainId) switchChain({ chainId: targetChainId });
        throw new Error("Wrong network, switch initiated.");
    }

    setTransactionState(action, 'awaiting_confirmation');
    try {
        const txHash = await writeContractAsync({
            abi: systemABI,
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

      if (actionType) {
        setLastAction(actionType);
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
             reason = txError.cause?.message || txError.shortMessage || "Transaction execution error.";
          } else {
             reason = e.shortMessage;
          }
        }
        
        const finalReason = reason.charAt(0).toUpperCase() + reason.slice(1).replace('execution reverted: ', '');
        toast({ variant: "destructive", title: "Transaction Error", description: finalReason });
       
        setTransactionState(action, 'error');
        setTimeout(() => setTransactionState(action, 'idle'), 2000);
        throw new Error(finalReason); 
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
        if (isWrongNetwork) {
            toast({ variant: "destructive", title: "Wrong Network", description: `Please switch to ${wagmiConfig.chains[0].name} to stake.` });
            if(targetChainId) switchChain({ chainId: targetChainId });
            throw new Error("Wrong network, switch initiated.");
        }

        toast({ title: "Approving...", description: "Please confirm the transaction in your wallet." });

        const approveTxHash = await writeContractAsync({
            abi: [ 
              { "constant": false, "inputs": [ { "name": "_spender", "type": "address" }, { "name": "_value", "type": "uint256" } ], "name": "approve", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
            ],
            address: tokenAddress,
            functionName: 'approve',
            args: [contractAddress, amountInUnits],
            account: address,
            gas: 250000n,
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

        await handleTransaction('deposit', 'deposit', [amountInUnits], { customToastTitle: "Staking...", actionType: 'deposit' });
        setTransactionState('deposit', 'done');

    } catch (e: any) {
        // handleTransaction уже показывает toast, поэтому здесь мы просто обрабатываем внутреннее состояние
        if (e instanceof Error && e.message.includes("User rejected the request")) {
          toast({ variant: "destructive", title: "Cancelled", description: "Transaction was cancelled." });
        } else if (!(e instanceof Error && e.message.startsWith('Transaction failed'))) {
           // Показываем ошибку, только si handleTransaction
           if (!e.message?.includes('User rejected the request') && !e.message.includes('Wrong network')) {
            toast({ variant: "destructive", title: "Deposit Error", description: e.message || "An unknown error occurred during deposit." });
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
      await handleTransaction('withdraw', 'withdraw', [amountInUnits], { actionType: 'withdraw'});
    } catch (error) {
      // Error is already handled by handleTransaction
    } finally {
        setLoadingState('withdraw', false);
    }
  };

  const withdrawAll = async () => {
    if (!systemData || systemData.playerBalance <= 0) {
      toast({ variant: "destructive", title: "No balance to withdraw" });
      return;
    }
     setLoadingState('withdrawAll', true);
    try {
      await handleTransaction('withdrawAll', 'withdrawAll', [], { actionType: 'withdraw'});
    } catch (error) {
      // Error is already handled by handleTransaction
    } finally {
      setLoadingState('withdrawAll', false);
    }
  };

  const makeMeRich = async () => {
    if (!systemData) return;
    if (systemData.playerBalance < systemData.minBet) {
       toast({ variant: "destructive", title: "Not enough funds", description: `You need at least ${systemData.minBet} to play.` });
       return;
    }

    try {
      localStorage.setItem(MMR_PREV_BALANCE_KEY, systemData.playerBalance.toString());
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
      // Error is already handled by handleTransaction. Clean up local storage here.
      localStorage.removeItem(MMR_PREV_BALANCE_KEY);
    }
  };

  const isLoading = isConnecting || (isConnected && (isTokenBalanceLoading || !systemData) && !isWrongNetwork);

  return {
    isConnected: isConnected,
    isWrongNetwork,
    address,
    formattedAddress,
    tokenBalance,
    tokenSymbol: tokenBalanceData?.symbol,
    systemData,
    isLoading,
    isDataFetching,
    isDisconnecting,
    actionLoading,
    transactionStatus,
    lastAction,
    isTutorialOpen,
    setIsTutorialOpen,
    openTutorial,
    connectWallet,
    disconnectWallet,
    deposit,
    withdraw,
    withdrawAll,
    makeMeRich,
    refreshData,
    clearTransactionStatus,
    getTransactionState,
    setLastAction,
    clearLastAction,
    contractAddress,
    tokenAddress
  };
}
