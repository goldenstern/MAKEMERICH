import GameUI from '@/components/game-ui';
import { Web3Provider } from '@/components/web3-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <GameUI />
      </Web3Provider>
    </QueryClientProvider>
  );
}
