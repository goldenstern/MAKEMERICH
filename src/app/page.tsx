"use client";

import SystemUI from '@/components/game-ui';
import { Web3Provider } from '@/components/web3-provider';
import * as React from 'react';


export default function Home() {
  return (
      <Web3Provider>
        <SystemUI />
      </Web3Provider>
  );
}
