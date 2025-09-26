"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownRight, Loader2, LogOut, PiggyBank, Scaling, Users, Wallet } from "lucide-react";

import { useWeb3 } from "@/hooks/use-web3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";

const amountSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }).min(0.00001),
});

type AmountFormValues = z.infer<typeof amountSchema>;

const Header = () => {
  const { isConnected, formattedAddress, disconnectWallet, connectWallet, isLoading } = useWeb3();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <span className="text-primary text-3xl font-bold">⨻</span>
        <h1 className="text-xl font-bold font-headline">MakeMeRich, GoldenStern!</h1>
      </div>
      {isClient && isConnected ? (
        <div className="flex items-center gap-4">
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
      <p className="text-muted-foreground mb-6 max-w-md">Connect your Web3 wallet to start playing. The game where you can multiply your tokens or lose them all. High risk, high reward!</p>
      <Button size="lg" onClick={connectWallet} disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Connect Wallet
      </Button>
    </div>
  );
};

const Dashboard = () => {
  const { gameData, tokenBalance, tokenSymbol, deposit, withdraw, withdrawAll, makeMeRich, isLoading, actionLoading } = useWeb3();

  const depositForm = useForm<AmountFormValues>({ resolver: zodResolver(amountSchema), defaultValues: { amount: 0 } });
  const withdrawForm = useForm<AmountFormValues>({ resolver: zodResolver(amountSchema), defaultValues: { amount: 0 } });

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


  return (
    <main className="p-4 sm:p-6 md:p-8 space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={PiggyBank} title="Total Pool" value={gameData?.totalPool.toLocaleString() ?? 0} isLoading={isLoading} unit="Tokens" />
        <StatCard icon={Users} title="Number of Players" value={gameData?.numberOfPlayers ?? 0} isLoading={isLoading} />
        <StatCard icon={ArrowDownRight} title="Minimum Bet" value={gameData?.minBet ?? 0} isLoading={isLoading} unit="Tokens" />
        <StatCard icon={Scaling} title="Risk Coefficient" value={gameData?.riskCoefficient ?? 0} isLoading={isLoading} unit="%" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 grid gap-8 md:grid-cols-2">
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
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Deposit Tokens</CardTitle>
                    <CardDescription>Move tokens from your wallet to the game.</CardDescription>
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
                                            <Input type="number" placeholder="Amount to deposit" {...field} step="any" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                        <CardFooter>
                             <Button type="submit" className="w-full" disabled={actionLoading['deposit']}>
                                {actionLoading['deposit'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Deposit
                            </Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>
        </div>
        <Card className="lg:col-span-1 row-start-1 lg:row-start-auto">
            <CardHeader>
                <CardTitle>Your Game Balance</CardTitle>
                <CardDescription>Tokens you can play with or withdraw.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                    {isLoading ? <Skeleton className="h-10 w-1/2" /> :
                      <><span className="text-4xl font-bold">{gameData?.playerBalance.toLocaleString() ?? 0}</span>
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
                                    <FormLabel className="sr-only">Amount</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="Amount to withdraw" {...field} step="any"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex flex-col sm:flex-row gap-2">
                           <Button type="submit" variant="secondary" className="w-full" disabled={actionLoading['withdraw']}>
                               {actionLoading['withdraw'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                               Withdraw Amount
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
            <Button size="lg" className="h-16 text-2xl font-bold w-full max-w-md shadow-lg transform hover:scale-105 transition-transform bg-primary hover:bg-primary/90" onClick={makeMeRich} disabled={actionLoading['makeMeRich'] || (gameData?.playerBalance ?? 0) < (gameData?.minBet ?? 0)}>
                {actionLoading['makeMeRich'] ? (
                  <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                ) : (
                  "MAKE ME RICH!"
                )}
            </Button>
             {(gameData?.playerBalance ?? 0) < (gameData?.minBet ?? 0) &&
                <p className="text-destructive mt-2 text-sm">You need at least {gameData?.minBet} tokens in your game balance to play.</p>
             }
        </div>
    </main>
  );
};

export default function GameUI() {
  const { isConnected } = useWeb3();
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {isClient ? (
        isConnected ? <Dashboard /> : <ConnectWalletView />
      ) : (
        <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>
      )}
    </div>
  );
}
