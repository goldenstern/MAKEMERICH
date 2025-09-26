import GameUI from '@/components/game-ui';
import { Web3Provider } from '@/components/web3-provider';

export default function Home() {
  return (
    <Web3Provider>
      <GameUI />
    </Web3Provider>
  );
}
