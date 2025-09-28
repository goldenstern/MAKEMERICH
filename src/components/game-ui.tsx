"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownRight, Link, Loader2, LogOut, PiggyBank, RefreshCw, Scaling, Users, Wallet } from "lucide-react";
import { useWeb3 } from "@/hooks/use-web3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "./ui/separator";
import { useConfig } from "wagmi";
import { mainnet } from "wagmi/chains";

const amountSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }).min(0.00001),
});

type AmountFormValues = z.infer<typeof amountSchema>;

const REFRESH_INTERVAL = 30; // in seconds

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
                        refreshData();
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
                {isDataFetching ? '' : `${countdown}s`}
             </span>
        </button>
    );
};


const Header = () => {
  const { isConnected, formattedAddress, disconnectWallet, connectWallet, isLoading } = useWeb3();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
            <span className="text-primary text-3xl font-bold">⨻</span>
            <h1 className="text-xl font-bold font-headline">MakeMeRich, GoldenStern!</h1>
        </div>
        <a href="https://angl.money" target="_blank" rel="noopener noreferrer" className="hidden md:flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Link className="h-4 w-4" />
            Visit AnglVerse Website
        </a>
      </div>
      {isClient && isConnected ? (
        <div className="flex items-center gap-4">
          <RefreshTimer />
          <div className="text-sm text-muted-foreground hidden sm:block">
            {formattedAddress}
          </div>
          <Button variant="outline" size="sm" onClick={disconnectWallet}>
            <LogOut className="mr-2 h-4 w-4" /> Disconnect
          </Button>
        </div>
      ) : isClient ? (
        <Button onClick={connectWallet} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wallet className="mr-2 h-4 w-4" />
          )}
          Connect Wallet
        </Button>
      ) : (
         <Skeleton className="h-10 w-40" />
      )}
    </header>
  );
};

const StatCard = ({ icon: Icon, title, value, isLoading, unit }: { icon: React.ElementType, title: string, value: string | number, isLoading: boolean, unit?: string }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      {isLoading ? <Skeleton className="h-8 w-3/4" /> : (
        <div className="text-2xl font-bold">
          {value} <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      )}
    </CardContent>
  </Card>
);

const ConnectWalletView = () => {
  const { connectWallet, isLoading } = useWeb3();
  return (
    <div className="flex flex-col items-center justify-center text-center h-[calc(100vh-80px)]">
      <div className="bg-accent rounded-full p-4 mb-6 flex items-center justify-center w-24 h-24">
        <span className="text-primary text-6xl font-bold">⨻</span>
      </div>
      <h2 className="text-4xl font-bold font-headline mb-2">Welcome to MakeMeRich</h2>
      <p className="text-muted-foreground mb-6 max-w-md">The apotheosis of randomness in WEB3 vibecode, trust your funds to AI algorithms to double it or loose.<br></br><br></br>Connect your Web3 wallet to start playing. The game where you can multiply your tokens or lose them all. High risk, high reward!</p>
      <Button size="lg" onClick={connectWallet} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Connect Wallet
      </Button>
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
  const { gameData, tokenBalance, tokenSymbol, deposit, withdraw, withdrawAll, makeMeRich, isLoading, actionLoading, getTransactionState, tokenAddress } = useWeb3();
  const config = useConfig();
  const [cooldown, setCooldown] = React.useState(0);

  const depositForm = useForm<AmountFormValues>({ resolver: zodResolver(amountSchema), defaultValues: { amount: 0 } });
  const withdrawForm = useForm<AmountFormValues>({ resolver: zodResolver(amountSchema), defaultValues: { amount: 0 } });

  const explorerUrl = React.useMemo(() => {
    const chain = config.chains.find(c => c.id === config.state.chainId);
    if (!chain || !tokenAddress) return '#';
    const baseUrl = chain.blockExplorers?.default.url;
    if (!baseUrl) {
      // Fallback for custom chains without explorer defined
      return `https://etherscan.io/token/${tokenAddress}`;
    }
    return `${baseUrl}/token/${tokenAddress}`;
  }, [config.state.chainId, config.chains, tokenAddress]);


  React.useEffect(() => {
    if (gameData?.nextAvailableTime) {
      const now = Math.floor(Date.now() / 1000);
      const remaining = gameData.nextAvailableTime - now;
      setCooldown(remaining > 0 ? remaining : 0);
    }
  }, [gameData?.nextAvailableTime]);

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);


  const onDeposit = (data: AmountFormValues) => {
    deposit(data.amount);
    depositForm.reset();
  };

  const onWithdraw = (data: AmountFormValues) => {
    withdraw(data.amount);
    withdrawForm.reset();
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
      return `Next block in ${formatCountdown(cooldown)}`;
    }
    return "MakeMeRich, GoldenStern!";
  };


  return (
    <main className="p-4 sm:p-6 md:p-8 space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={PiggyBank} title="Total Pool" value={gameData?.totalPool.toLocaleString() ?? 0} isLoading={isLoading} unit={tokenSymbol || ''} />
        <StatCard icon={Users} title="Number of Players" value={gameData?.numberOfPlayers ?? 0} isLoading={isLoading} />
        <StatCard icon={ArrowDownRight} title="Minimum Stake (24h)" value={gameData?.minBet.toLocaleString() ?? 0} isLoading={isLoading} unit={tokenSymbol || ''} />
        <StatCard icon={Scaling} title="Risk Coefficient" value={gameData?.riskCoefficient ?? 0} isLoading={isLoading} unit="%" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Your Wallet</CardTitle>
                        <CardDescription>Your available token balance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isLoading ? <Skeleton className="h-10 w-1/2" /> :
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">{formattedTokenBalance}</span>
                                <span className="text-muted-foreground">{tokenSymbol || 'Tokens'}</span>
                            </div>
                         }
                        <Separator />
                        <div className="space-y-2">
                            <h4 className="font-medium text-sm">Buy/Sell Angl Shards (ANGLS) Now</h4>
                            <div className="flex flex-col sm:flex-row gap-2">
                               <Button variant="default" size="sm" className="w-full">
                                    <a href="https://gscb.io/b9668481" target="_blank" rel="noopener noreferrer">GSCB</a>
                               </Button>
                                <Button variant="default" size="sm" className="w-full">
                                    <a href="https://azbit.com/exchange/ANGLS_USDT/" target="_blank" rel="noopener noreferrer">AZbit</a>
                                </Button>
                                <Button variant="default" size="sm" className="w-full">
                                    <a href="https://pancakeswap.finance/swap?inputCurrency=0x31CD5Df78EEe2f105c4717d1b61F5E496D5E377E&outputCurrency=0x55d398326f99059fF775485246999027B3197955&chain=bsc" target="_blank" rel="noopener noreferrer">Pancake</a>
                                </Button>
                            </div>
                             <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                                <a href={explorerUrl} target="_blank" rel="noopener noreferrer">Token Contract</a>
                             </Button>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Stake Tokens</CardTitle>
                        <CardDescription>Stake tokens from your wallet to the MMR AI.</CardDescription>
                    </CardHeader>
                     <Form {...depositForm}>
                        <form onSubmit={depositForm.handleSubmit(onDeposit)}>
                            <CardContent className="space-y-2">
                                <FormField
                                    control={depositForm.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="sr-only">Amount</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="Amount to stake" {...field} step="any" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                            <CardFooter>
                                 <Button type="submit" className="w-full" disabled={actionLoading['deposit']}>
                                    {actionLoading['deposit'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Stake
                                </Button>
                            </CardFooter>
                        </form>
                    </Form>
                </Card>
            </div>
        </div>
        <Card className="lg:col-span-1">
            <CardHeader>
                <CardTitle>Your Stake</CardTitle>
                <CardDescription>Tokens you can use or withdraw.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                    {isLoading ? <Skeleton className="h-10 w-1/2" /> :
                      <><span className="text-4xl font-bold text-primary">{gameData?.playerBalance.toLocaleString() ?? 0}</span>
                      <span className="text-muted-foreground">{tokenSymbol || 'Tokens'}</span></>
                    }
                </div>
                 <Form {...withdrawForm}>
                    <form onSubmit={withdrawForm.handleSubmit(onWithdraw)} className="space-y-4">
                        <FormField
                            control={withdrawForm.control}
                            name="amount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="sr-only">Withdraw</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Amount to withdraw" {...field} step="any"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <p className="text-xs text-center text-muted-foreground">A regular {gameData?.feePercent ?? 3}% GSCB fee applies to all withdrawals.</p>
                        <div className="flex flex-col sm:flex-row gap-2">
                           <Button type="submit" variant="secondary" className="w-full" disabled={actionLoading['withdraw'] || (gameData?.playerBalance ?? 0) === 0}>
                               {actionLoading['withdraw'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Withdraw
                           </Button>
                           <Button type="button" variant="secondary" className="w-full" onClick={() => withdrawAll()} disabled={actionLoading['withdrawAll'] || (gameData?.playerBalance ?? 0) === 0}>
                               {actionLoading['withdrawAll'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Withdraw All
                           </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </div>

       <div className="text-center pt-8">
            <h3 className="text-2xl font-bold font-headline mb-4">Ready to Play?</h3>
            <Button 
                size="lg" 
                className="h-16 text-xl font-bold w-full max-w-md shadow-lg transform hover:scale-105 transition-transform bg-primary hover:bg-primary/90" 
                onClick={makeMeRich} 
                disabled={getTransactionState('makeMeRich').isActive || (gameData?.playerBalance ?? 0) < (gameData?.minBet ?? 0) || cooldown > 0}
            >
                {getMakeMeRichButtonContent()}
            </Button>
             {((gameData?.playerBalance ?? 0) < (gameData?.minBet ?? 0) && !isLoading && cooldown === 0) &&
                <p className="text-destructive mt-2 text-sm">You need at least {gameData?.minBet} tokens in your game balance to play.</p>
             }
        </div>
    </main>
  );
};

export default function GameUI() {
  const { isConnected, isDataFetching, transactionStatus, clearTransactionStatus, gameData } = useWeb3();
  const [isClient, setIsClient] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [showTears, setShowTears] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  const prevPlayerBalance = React.useRef<number | undefined>();
  const isCheckingWin = React.useRef(false);

  React.useEffect(() => {
    if (transactionStatus.action === 'makeMeRich' && transactionStatus.status === 'confirmed') {
      isCheckingWin.current = true;
      // We don't check for win here, we wait for the data to be fetched
    }
  }, [transactionStatus]);

  React.useEffect(() => {
    // This effect runs when gameData changes.
    if (isCheckingWin.current && !isDataFetching && gameData) {
      const currentBalance = gameData.playerBalance;
      const previousBalance = prevPlayerBalance.current;
      
      if (previousBalance !== undefined) {
          if (currentBalance > previousBalance) {
            setShowConfetti(true);
          } else if (currentBalance < previousBalance) {
            setShowTears(true);
          }
      }
      
      // Reset flags and clear status
      isCheckingWin.current = false;
      clearTransactionStatus();
    }
    
    // Always update the previous balance when gameData is available and not fetching
    if (gameData && !isDataFetching) {
      prevPlayerBalance.current = gameData.playerBalance;
    }
  }, [gameData, isDataFetching, clearTransactionStatus]);


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
       {isClient && isDataFetching && (
            <div className="fixed bottom-4 left-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )}
    </div>
  );
}
