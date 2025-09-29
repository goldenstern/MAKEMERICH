"use client";

import GameUI from '@/components/game-ui';
import { Web3Provider } from '@/components/web3-provider';
import * as React from 'react';


export default function Home() {
  return (
      <Web3Provider>
        <GameUI />
      </Web3Provider>
  );
}
