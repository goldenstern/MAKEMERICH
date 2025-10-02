

"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReactMarkdown from 'react-markdown';
import { ArrowDownRight, ArrowRight, Link, Loader2, LogOut, PiggyBank, RefreshCw, Scaling, Users, Wallet, Share2, HelpCircle, CircleDollarSign, Bot, Users2, BrainCircuit } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "./ui/separator";
import { useConfig } from "wagmi";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ActionType, ParticleSphere } from "./particle-sphere";

const amountSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }).min(0.00001),
});

type AmountFormValues = z.infer<typeof amountSchema>;

const REFRESH_INTERVAL = 30; // in seconds
const DONT_REMIND_STORAGE_KEY = "mmr-dont-remind-again";
const MMR_PREV_BALANCE_KEY = "mmr-prev-balance";

// A component for the confetti effect
const Confetti = ({ onComplete }: { onComplete: () => void }) => {
  const [triangles, setTriangles] = React.useState<JSX.Element[]>([]);

  React.useEffect(() => {
    const newTriangles = Array.from({ length: 100 }).map((_, i) => {
      const style: React.CSSProperties = {
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`,
        animation: `fly-${i} 3s ease-out forwards`,
        zIndex: 1000,
      };
      const keyframes = `
        @keyframes fly-${i} {
          0% {
            transform: translate(-50%, -50%) rotate(${Math.random() * 360}deg) scale(0.5);
            opacity: 1;
          }
          100% {
            transform: translate(calc(-50% + ${Math.random() * 200 - 100}vw), calc(-50% + ${Math.random() * 200 - 100}vh)) rotate(${Math.random() * 1000 - 500}deg) scale(1.5);
            opacity: 0;
          }
        }
      `;
      return (
        <React.Fragment key={i}>
          <style>{keyframes}</style>
          <div style={style}>
            <svg width="20" height="20" viewBox="0 0 10 10">
              <polygon points="5,0 10,10 0,10" fill="gold" />
            </svg>
          </div>
        </React.Fragment>
      );
    });
    setTriangles(newTriangles);

    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return <>{triangles}</>;
};

// A component for the losing effect
const Tears = ({ onComplete }: { onComplete: () => void }) => {
  const [drops, setDrops] = React.useState<JSX.Element[]>([]);

  React.useEffect(() => {
    const newDrops = Array.from({ length: 50 }).map((_, i) => {
      const style: React.CSSProperties = {
        position: 'fixed',
        left: `${Math.random() * 100}vw`,
        top: '-20px',
        animation: `fall-${i} ${2 + Math.random() * 2}s linear forwards`,
        animationDelay: `${Math.random() * 2}s`,
        zIndex: 1000,
      };
      const keyframes = `
        @keyframes fall-${i} {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) scale(1);
            opacity: 0;
          }
        }
      `;
      return (
        <React.Fragment key={i}>
          <style>{keyframes}</style>
          <div style={style}>
             <svg width="15" height="20" viewBox="0 0 15 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 20C11.6421 20 15 15.5228 15 10C15 4.47715 7.5 0 7.5 0C7.5 0 0 4.47715 0 10C0 15.5228 3.35786 20 7.5 20Z" fill="#A4C2F4"/>
            </svg>
          </div>
        </React.Fragment>
      );
    });
    setDrops(newDrops);

    const timer = setTimeout(() => {
      onComplete();
    }, 5000); // Animation duration + delay

    return () => clearTimeout(timer);
  }, [onComplete]);

  return <>{drops}</>;
};

const LitepaperDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const [markdown, setMarkdown] = React.useState('');

  React.useEffect(() => {
    if (open) {
      fetch('/LitepaperEN_new.md')
        .then(response => response.text())
        .then(text => setMarkdown(text));
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>MakeMeRich, AI: Litepaper</DialogTitle>
          <DialogDescription>
            Crowd Wisdom Utopian Money AI
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[70vh] w-full pr-6">
          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold font-headline mt-6 mb-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold font-headline mt-4 mb-2 border-b pb-1" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold font-headline mt-4" {...props} />,
                p: ({node, ...props}) => <p className="leading-relaxed my-2" {...props} />,
                strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                em: ({node, ...props}) => <em className="italic" {...props} />,
                code: ({node, ...props}) => <code className="bg-muted text-muted-foreground rounded px-1 py-0.5 text-sm" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                hr: ({node, ...props}) => <hr className="my-4 border-border" {...props} />,
              }}
            >{markdown}</ReactMarkdown>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const TutorialDialog = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => {
  const InfoCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex items-start gap-4">
      <div className="bg-primary/10 text-primary p-3 rounded-full">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <h3 className="font-bold font-headline text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>MakeMeRich, AI: A Crowd Wisdom Experiment</DialogTitle>
          <DialogDescription>
            An exploration into collective intelligence and decentralized financial systems.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-6">
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-headline text-center text-primary">Step 1: Making Your Contribution</h2>
              <InfoCard 
                icon={Wallet} 
                title="Connect & Acquire ANGLS"
                description="Link your Web3 wallet to participate. You will need ANGLS tokens to make a contribution to the system's shared pool."
              />
              <InfoCard 
                icon={CircleDollarSign} 
                title="Stake Your Contribution"
                description="Enter the amount of ANGLS you wish to contribute and click 'Stake'. Your tokens are now part of the collective intelligence pool."
              />
            </div>

            <Separator />
            
            <div className="space-y-4">
              <h2 className="text-xl font-bold font-headline text-center text-primary">Step 2: Activating the AI</h2>
               <InfoCard 
                icon={BrainCircuit} 
                title="The Principle of Crowd Wisdom"
                description="The AI analyzes the collective actions of all participants—the total pool size, number of contributors, and their activity. This data forms the 'Crowd Wisdom'."
              />
              <InfoCard 
                icon={Bot} 
                title="Request an Evaluation"
                description="By clicking 'MakeMeRich, AI', you request the algorithm to evaluate the system's current state. Based on its analysis, it determines an outcome for your contribution, potentially doubling it or absorbing it to stabilize the system."
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <h2 className="text-xl font-bold font-headline text-center text-primary">Step 3: Collective Growth</h2>
              <InfoCard 
                icon={Users2} 
                title="Farm Attention to Strengthen the AI"
                description="Click 'Farm Attention' to invite others. More participants provide the AI with richer data, increasing its analytical accuracy and strengthening the entire system's health. Your contribution to growth benefits all participants."
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <DialogClose asChild>
            <Button type="button" className="w-full">
              Continue
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const RefreshTimer = () => {
    const { isDataFetching, refreshData } = useWeb3();
    const [countdown, setCountdown] = React.useState(REFRESH_INTERVAL);

    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isDataFetching) {
            setCountdown(REFRESH_INTERVAL);
        } else {
            setCountdown(REFRESH_INTERVAL);
            timer = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        setTimeout(() => refreshData(), 0);
                        return REFRESH_INTERVAL;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [isDataFetching, refreshData]);

    const handleRefresh = () => {
      if (!isDataFetching) {
        refreshData();
      }
    }
    
    return (
        <button onClick={handleRefresh} disabled={isDataFetching} className="flex items-center gap-2 text-sm text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed">
             <RefreshCw className={`h-4 w-4 ${isDataFetching ? 'animate-spin' : ''}`} />
             <span>
                {isDataFetching ? '...' : `${countdown}s`}
             </span>
        </button>
    );
};


const Header = () => {
  const { isConnected, formattedAddress, disconnectWallet, connectWallet, isLoading, isDisconnecting } = useWeb3();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="p-4 border-b">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
              <span className="text-primary text-3xl font-bold">⨻</span>
              <h1 className="text-lg sm:text-xl font-bold font-headline">MakeMeRich, AI</h1>
          </div>
          
          {isClient && isConnected ? (
            <div className="flex sm:hidden items-center gap-2">
              <div className="text-sm text-muted-foreground">
                {formattedAddress}
              </div>
              <Button variant="outline" size="icon" onClick={disconnectWallet} disabled={isDisconnecting}>
                {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
              </Button>
            </div>
          ) : isClient ? (
             <div className="sm:hidden">
                <Button onClick={connectWallet} disabled={isLoading} size="sm">
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="mr-2 h-4 w-4" />
                  )}
                  Connect
                </Button>
             </div>
          ) : (
             <Skeleton className="h-9 w-24 sm:hidden" />
          )}
        </div>

        <div className="flex items-center sm:gap-4 justify-between sm:justify-start">
          <a href="https://angl.money" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Link className="h-4 w-4" />
              AnglVerse Ecosystem
          </a>

          <div className="flex items-center gap-4">
            {isClient && isConnected ? (
              <>
                <RefreshTimer />
                <div className="hidden sm:block text-sm text-muted-foreground">
                  {formattedAddress}
                </div>
                <Button variant="outline" size="icon" onClick={disconnectWallet} className="hidden sm:inline-flex" disabled={isDisconnecting}>
                   {isDisconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                </Button>
              </>
            ) : isClient ? (
              <div className="hidden sm:block">
                <Button onClick={connectWallet} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Wallet className="mr-2 h-4 w-4" />
                  )}
                  Connect Wallet
                </Button>
              </div>
            ) : (
              <Skeleton className="h-10 w-40 hidden sm:block" />
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const StatCard = ({ icon: Icon, title, value, isLoading, unit }: { icon: React.ElementType, title: string, value: string | number, isLoading: boolean, unit?: string }) => (
  <div className="p-4 border-0">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <Separator />
    <div className="mt-2">
      {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
        <div className="text-2xl font-bold">
          {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
        </div>
      )}
    </div>
  </div>
);

const ConnectWalletView = () => {
  const { connectWallet, isLoading, openTutorial } = useWeb3();
  return (
    <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-80px)] px-4">
      <div className="bg-accent rounded-full p-4 mb-6 flex items-center justify-center w-24 h-24">
        <span className="text-primary text-6xl font-bold">⨻</span>
      </div>
      <h2 className="text-4xl font-bold font-headline mb-2">Welcome to MakeMeRich, AI</h2>
      <p className="text-muted-foreground mb-8 max-w-md">The apotheosis of clarity in WEB3 vibecode: stake your funds into Crowd Wisdom AI algorithm to double it or loose.</p>
      <div className="flex flex-col gap-4 w-full max-w-xs">
         <Button variant="outline" onClick={openTutorial}>
            <HelpCircle className="mr-2 h-4 w-4" />
            How It Works
         </Button>
         <Button size="lg" onClick={connectWallet} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="mr-2 h-4 w-4" />
          )}
          Connect Wallet
        </Button>
      </div>
    </div>
  );
};

const formatCountdown = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [
    h > 0 ? h.toString().padStart(2, '0') : null,
    m.toString().padStart(2, '0'),
    s.toString().padStart(2, '0'),
  ].filter(Boolean).join(':');
};


const Dashboard = () => {
  const { systemData, tokenBalance, tokenSymbol, deposit, withdraw, withdrawAll, makeMeRich, isLoading, actionLoading, getTransactionState, tokenAddress, contractAddress, lastAction, clearLastAction } = useWeb3();
  const config = useConfig();
  const [cooldown, setCooldown] = React.useState(0);
  const [isRiskDialogOpen, setIsRiskDialogOpen] = React.useState(false);
  const [isLitepaperOpen, setIsLitepaperOpen] = React.useState(false);
  const [dontRemindAgain, setDontRemindAgain] = React.useState(false);

  const amountForm = useForm<AmountFormValues>({ resolver: zodResolver(amountSchema), defaultValues: { amount: 0 } });
  
  const explorerUrl = React.useMemo(() => {
    const chain = config.chains.find(c => c.id === config.state.chainId);
    if (!chain) return '#';
    const baseUrl = chain.blockExplorers?.default.url;
    if (!baseUrl) {
      // Fallback for custom chains without explorer defined
      return `https://bscscan.com`;
    }
    return baseUrl;
  }, [config.state.chainId, config.chains]);

  const tokenExplorerUrl = tokenAddress ? `${explorerUrl}/token/${tokenAddress}` : `${explorerUrl}`;
  const poolExplorerUrl = contractAddress ? `${explorerUrl}/address/${contractAddress}` : `${explorerUrl}`;


  React.useEffect(() => {
    if (systemData?.nextAvailableTime) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = systemData.nextAvailableTime - now;
      setCooldown(remaining > 0 ? remaining : 0);
    }
  }, [systemData?.nextAvailableTime]);

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  React.useEffect(() => {
    const savedPreference = localStorage.getItem(DONT_REMIND_STORAGE_KEY);
    if (savedPreference === 'true') {
      setDontRemindAgain(true);
    }
  }, []);

  const handleMakeMeRichClick = () => {
    if (getTransactionState('makeMeRich').isActive || (systemData?.playerBalance ?? 0) < (systemData?.minBet ?? 0) || cooldown > 0) {
      return;
    }
    const shouldRemind = !dontRemindAgain && localStorage.getItem(DONT_REMIND_STORAGE_KEY) !== 'true';
    if (shouldRemind) {
      setIsRiskDialogOpen(true);
    } else {
      makeMeRich();
    }
  };

  const handleConfirmRisk = () => {
    if (dontRemindAgain) {
      localStorage.setItem(DONT_REMIND_STORAGE_KEY, 'true');
    }
    setIsRiskDialogOpen(false);
    makeMeRich();
  };


  const onDeposit = (data: AmountFormValues) => {
    deposit(data.amount);
    amountForm.reset();
  };

  const onWithdraw = (data: AmountFormValues) => {
    withdraw(data.amount);
    amountForm.reset();
  };
  
  const formattedTokenBalance = parseFloat(tokenBalance).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });

  const getMakeMeRichButtonContent = () => {
    const state = getTransactionState('makeMeRich');
    if (state.isActive) {
      switch (state.stage) {
        case 'awaiting_confirmation':
          return "Awaiting confirmation...";
        case 'processing':
          return "Processing...";
        default:
          return <Loader2 className="h-8 w-8 animate-spin" />;
      }
    }
    if (cooldown > 0) {
      return `Next MMR AI block in ${formatCountdown(cooldown)}`;
    }
    return "MakeMeRich, AI";
  };

  const handleShare = async () => {
    const shareData = {
      title: document.title,
      text: "The apotheosis of clarity in WEB3 vibecode: stake your funds into Crowd Wisdom AI algorithm to double it or loose.",
      url: "https://mmr.angl.money/",
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error("Share failed:", err);
        // Fallback for browsers that fail to share
        window.open(shareData.url, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      window.open(shareData.url, '_blank', 'noopener,noreferrer');
    }
  };

  const isBalanceInsufficient = !isLoading && (systemData?.playerBalance ?? 0) < (systemData?.minBet ?? 0);
  const isMMRDisabled = getTransactionState('makeMeRich').isActive || isBalanceInsufficient || cooldown > 0;

  return (
    <main className="p-4 sm:p-6 md:p-8 space-y-8">
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4 md:col-span-2 lg:col-span-1 lg:order-last">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard icon={PiggyBank} title="Total Pool" value={systemData?.totalPool.toLocaleString() ?? 0} isLoading={isLoading} unit={tokenSymbol || ''} />
            <StatCard icon={Users} title="Pool Attention" value={systemData?.numberOfPlayers ?? 0} isLoading={isLoading} />
            <StatCard icon={ArrowDownRight} title="Minimum Stake" value={systemData?.minBet.toLocaleString() ?? 0} isLoading={isLoading} unit={tokenSymbol || ''} />
            <StatCard icon={Scaling} title="Risk Coefficient" value={systemData?.riskCoefficient ?? 0} isLoading={isLoading} unit="%" />
          </div>
           <Card>
                <CardHeader>
                     <CardTitle className="text-sm font-medium">Buy/Sell Angl Shards (ANGLS) Now & DYOR</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                       <Button variant="default" size="sm" className="w-full" asChild>
                            <a href="https://angl.app/exchange" target="_blank" rel="noopener noreferrer">GSCB</a>
                       </Button>
                        <Button variant="default" size="sm" className="w-full" asChild>
                            <a href="https://azbit.com/exchange/ANGLS_USDT/" target="_blank" rel="noopener noreferrer">AZbit</a>
                        </Button>
                        <Button variant="default" size="sm" className="w-full" asChild>
                            <a href="https://pancakeswap.finance/swap?inputCurrency=0x31CD5Df78EEe2f105c4717d1b61F5E496D5E377E&outputCurrency=0x55d398326f99059fF775485246999027B3197955&chain=bsc" target="_blank" rel="noopener noreferrer">Pancake</a>
                        </Button>
                    </div>
                     <div className="flex flex-col sm:flex-row gap-2 mt-2">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => setIsLitepaperOpen(true)}>
                            Litepaper
                         </Button>
                         <Button variant="outline" size="sm" className="w-full" asChild>
                            <a href={tokenExplorerUrl} target="_blank" rel="noopener noreferrer">Token 0x...</a>
                         </Button>
                         <Button variant="outline" size="sm" className="w-full" asChild>
                            <a href={poolExplorerUrl} target="_blank" rel="noopener noreferrer">Pool 0x...</a>
                         </Button>
                     </div>
                </CardContent>
            </Card>
        </div>
        <Card className="md:col-span-2 lg:col-span-1 lg:order-first">
            <CardHeader>
                <CardTitle>Stake</CardTitle>
                <CardDescription>Manage your staked tokens.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                        {isLoading ? <Skeleton className="h-10 w-1/2" /> :
                        <><span className="text-4xl font-bold text-primary">{systemData?.playerBalance.toLocaleString() ?? 0}</span>
                        <span className="text-muted-foreground">{tokenSymbol || 'Tokens'}</span></>
                        }
                    </div>
                     <div className="text-sm text-muted-foreground">
                        In Wallet: {isLoading ? <Skeleton className="h-4 w-24 inline-block" /> : <span>{formattedTokenBalance} {tokenSymbol}</span>}
                    </div>
                </div>
                 <Form {...amountForm}>
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                        <FormField
                            control={amountForm.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Amount" {...field} step="any"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button type="button" onClick={amountForm.handleSubmit(onDeposit)} className="w-full" disabled={actionLoading['deposit']}>
                               {actionLoading['deposit'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Stake
                           </Button>
                           <Button type="button" onClick={amountForm.handleSubmit(onWithdraw)} variant="secondary" className="w-full" disabled={actionLoading['withdraw'] || (systemData?.playerBalance ?? 0) === 0}>
                               {actionLoading['withdraw'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Withdraw
                           </Button>
                        </div>
                        <Button type="button" variant="secondary" className="w-full" onClick={() => withdrawAll()} disabled={actionLoading['withdrawAll'] || (systemData?.playerBalance ?? 0) === 0}>
                           {actionLoading['withdrawAll'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                           Withdraw All
                        </Button>
                        <Separator />
                        <p className="text-xs text-center text-muted-foreground">
                            A regular {systemData?.feePercent ?? 3}% GSCB service fee applies to all withdrawals.
                            Please note: as this is a new dApp, wallets like MetaMask may show a standard warning about an unverified contract. This is expected behavior.
                        </p>
                    </form>
                </Form>
            </CardContent>
        </Card>
         <div className="md:col-span-2 lg:col-span-1 relative lg:order-none">
          {isLoading ? (
            <Skeleton className="aspect-square w-full rounded-lg" />
          ) : (
            <ParticleSphere
              totalPool={systemData?.totalPool ?? 0}
              playerStake={systemData?.playerBalance ?? 0}
              lastAction={lastAction}
              onAnimationComplete={clearLastAction}
              onClick={handleMakeMeRichClick}
              disabled={isMMRDisabled}
            />
          )}
        </div>
      </div>

       <div className="text-center pt-8">
            {isBalanceInsufficient && !isLoading ? (
                <h3 className="text-2xl font-bold font-headline mb-4 text-destructive">
                    You need at least {systemData?.minBet.toLocaleString()} {tokenSymbol} in your stake to activate MMR AI.
                </h3>
            ) : (
                <h3 className="text-2xl font-bold font-headline mb-4">Ready to risk it all?</h3>
            )}
            <div className="flex flex-col sm:flex-row justify-center items-stretch gap-2 max-w-lg mx-auto">
              <Button 
                  size="lg" 
                  className="w-full h-16 text-xl font-bold shadow-lg transform hover:scale-105 transition-transform bg-primary hover:bg-primary/90" 
                  onClick={handleMakeMeRichClick} 
                  disabled={isMMRDisabled}
              >
                  {getMakeMeRichButtonContent()}
              </Button>
              <Button variant="outline" size="lg" className="w-full h-16" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" /> Farm Attention
              </Button>
            </div>
        </div>
        <AlertDialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will risk your entire stake ({systemData?.playerBalance.toLocaleString()} {tokenSymbol}) for a chance to double it. This is a high-risk, high-reward opportunity.
              </AlertDialogDescription>
            </AlertDialogHeader>
             <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={dontRemindAgain} onCheckedChange={(checked) => setDontRemindAgain(checked as boolean)} />
                <Label htmlFor="terms" className="text-sm text-muted-foreground">Do not remind me again</Label>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmRisk} className="bg-primary hover:bg-primary/90">I understand the risk</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <LitepaperDialog open={isLitepaperOpen} onOpenChange={setIsLitepaperOpen} />
    </main>
  );
};

export default function SystemUI() {
  const { isConnected, isDataFetching, transactionStatus, clearTransactionStatus, systemData, setLastAction, isTutorialOpen, setIsTutorialOpen } = useWeb3();
  const { toast } = useToast();
  const [isClient, setIsClient] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showTears, setShowTears] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const hasCheckedWin = React.useRef(false);

  React.useEffect(() => {
    if (
      transactionStatus.action === 'makeMeRich' &&
      transactionStatus.status === 'confirmed' &&
      !isDataFetching &&
      systemData &&
      !hasCheckedWin.current
    ) {
      hasCheckedWin.current = true;
      const prevBalanceStr = localStorage.getItem(MMR_PREV_BALANCE_KEY);

      if (prevBalanceStr) {
        const prevBalance = parseFloat(prevBalanceStr);
        const currentBalance = systemData.playerBalance;

        if (currentBalance > prevBalance) {
          setShowConfetti(true);
          setLastAction('win');
          toast({ title: "You Won!", description: "Your stake has been doubled." });
        } else if (currentBalance < prevBalance) {
          setShowTears(true);
          setLastAction('lose');
          toast({ variant: "destructive", title: "You Lost...", description: "Your stake is gone. Better luck next time!" });
        } else {
           toast({ title: "Transaction Confirmed", description: "Your balance is unchanged." });
        }
        localStorage.removeItem(MMR_PREV_BALANCE_KEY);
      }
      
      clearTransactionStatus();
    }
  }, [transactionStatus, isDataFetching, systemData, clearTransactionStatus, toast, setLastAction]);

  // Reset the check flag if the transaction is no longer active
  React.useEffect(() => {
      if (transactionStatus.status !== 'confirmed') {
          hasCheckedWin.current = false;
      }
  }, [transactionStatus]);


  return (
    <div className="min-h-screen bg-background">
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}
      {showTears && <Tears onComplete={() => setShowTears(false)} />}
      <Header />
      {isClient ? (
        isConnected ? <Dashboard /> : <ConnectWalletView />
      ) : (
        <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>
      )}
      <TutorialDialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen} />
       {isClient && isDataFetching && (
            <div className="fixed bottom-4 left-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )}
    </div>
  );
}
