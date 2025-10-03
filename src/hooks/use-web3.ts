"use client";

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAccount, useConnect, useDisconnect, useWriteContract, useBalance, useConfig, useSwitchChain } from 'wagmi';
import { metaMask } from '@wagmi/connectors';
import { parseUnits, formatUnits, BaseError } from 'viem';
import { waitForTransactionReceipt, readContract, watchAccount } from 'wagmi/actions'
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
  const { address, isConnected: wagmiIsConnected, isConnecting, chainId } = useAccount();
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

  const targetChain = wagmiConfig.chains[0];
  const isWrongNetwork = wagmiIsConnected && chainId !== targetChain.id;
  const isConnected = wagmiIsConnected && !isWrongNetwork;

  const refreshData = useCallback(async (): Promise<SystemData | null> => {
    if (isDataFetching) return systemData;
    const currentAddress = wagmiConfig.state.connections.get(wagmiConfig.state.current!)?.accounts[0];
    if (!currentAddress) return null;
    
    setIsDataFetching(true);
    try {
        const systemDataResult = await readContract(wagmiConfig, {
            abi: systemABI,
            address: contractAddress,
            functionName: 'getAIData',
            args: [],
            account: currentAddress,
        });

        const feePercentResult = await readContract(wagmiConfig, {
            abi: systemABI,
            address: contractAddress,
            functionName: 'feePercent',
            args: [],
            account: currentAddress,
        });

        const tokenDecimalsResult = await readContract(wagmiConfig, {
          abi: systemABI,
          address: contractAddress,
          functionName: 'tokenDecimals',
        });


        const data: SystemData = {
            playerBalance: parseFloat(formatUnits((systemDataResult as any)[0], tokenDecimalsResult as number)),
            totalPool: parseFloat(formatUnits((systemDataResult as any)[1], tokenDecimalsResult as number)),
            numberOfPlayers: Number((systemDataResult as any)[2]),
            minBet: parseFloat(formatUnits((systemDataResult as any)[3], tokenDecimalsResult as number)),
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
  }, [isDataFetching, systemData, wagmiConfig]);
  
  const { data: tokenBalanceData, refetch: refetchTokenBalance, isLoading: isTokenBalanceLoading } = useBalance({
    address,
    token: tokenAddress,
    query: {
        enabled: isConnected,
        refetchInterval: 30000,
    }
  });

  useEffect(() => {
    const unwatch = watchAccount(wagmiConfig, {
      onChange(account) {
        if (account.isConnected && account.chainId === targetChain.id) {
          refreshData();
          refetchTokenBalance();
        } else if (!account.isConnected) {
          setSystemData(null);
        }
      },
    });
    return () => unwatch();
  }, [wagmiConfig, targetChain.id, refreshData, refetchTokenBalance]);

  useEffect(() => {
    if (isConnected) {
      refreshData();
      refetchTokenBalance();
    } else {
      setSystemData(null);
    }
  }, [isConnected, refreshData, refetchTokenBalance]);
  
  const connectWallet = useCallback(async () => {
    const metaMaskConnector = connectors.find(c => c.id === 'metaMask');
    if (!metaMaskConnector) {
        toast({ variant: "destructive", title: "MetaMask not found", description: "Please install MetaMask to continue." });
        return;
    }

    try {
        if (chainId !== targetChain.id) {
            await switchChain({ chainId: targetChain.id });
        }
        await connect({ connector: metaMaskConnector, chainId: targetChain.id });
    } catch (error: any) {
        if (error instanceof UserRejectedRequestError) {
            toast({ variant: "destructive", title: "Connection Failed", description: "Connection request rejected." });
        } else if (error instanceof SwitchChainError) {
            toast({ variant: "destructive", title: "Network Switch Failed", description: "Could not switch to the correct network. Please do it manually." });
        } else {
            toast({ variant: "destructive", title: "Connection Failed", description: "An unexpected error occurred while connecting." });
        }
        console.error("Connection error:", error);
    }
  }, [connect, connectors, chainId, targetChain.id, switchChain, toast]);

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
    if (wagmiIsConnected) {
        fetchDecimals();
    }
  }, [wagmiConfig, wagmiIsConnected]);

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

    if (!isConnected) {
      const errorMsg = "Wallet not connected or wrong network.";
      toast({ variant: "destructive", title: "Error", description: errorMsg });
      throw new Error(errorMsg);
    }

    if (isWrongNetwork) {
        toast({ variant: "destructive", title: "Wrong Network", description: `Please switch to ${targetChain.name} to perform this action.` });
        switchChain({ chainId: targetChain.id });
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
    if (!isConnected) {
      toast({ variant: "destructive", title: "Error", description: "Wallet not connected." });
      return;
    }
    if (amount <= 0) return toast({ variant: "destructive", title: "Invalid amount" });
    
    const amountInUnits = parseUnits(amount.toString(), tokenDecimals);
    
    setLoadingState('deposit', true);
    setTransactionState('deposit', 'awaiting_confirmation');

    try {
        if (isWrongNetwork) {
            toast({ variant: "destructive", title: "Wrong Network", description: `Please switch to ${targetChain.name} to stake.` });
            switchChain({ chainId: targetChain.id });
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
           // Показываем ошибку, только если она не из handleTransaction
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

  const isLoading = isConnecting || (wagmiIsConnected && (isTokenBalanceLoading || !systemData));

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
