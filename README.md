# MakeMeRich, AI

> The apotheosis of clarity in WEB3 vibecode: stake your funds into Crowd Wisdom AI algorithm to double it or lose it all.

This project is a decentralized application (dApp) built on the Next.js framework. It allows users to interact with a smart contract deployed on the Binance Smart Chain (BSC), creating a high-risk, high-reward staking game powered by a "Crowd Wisdom AI" algorithm.

## ✨ Features

- **Web3 Wallet Integration:** Connects with MetaMask and other wallets using `wagmi`.
- **BSC Network:** Operates exclusively on the Binance Smart Chain.
- **Smart Contract Interaction:** Stake, withdraw, and risk your `ANGLS` tokens.
- **Dynamic UI:** A responsive interface built with ShadCN UI and Tailwind CSS, featuring real-time data updates.
- **AI-Powered Gameplay:** A central "MakeMeRich, AI" function that determines the game's outcome.
- **Gamified Experience:** Includes visual effects for winning and losing to enhance user engagement.

## 🛠️ Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (with App Router)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/)
- **Web3:** [wagmi](https://wagmi.sh/) & [Viem](https://viem.sh/) for wallet connection and contract interaction.
- **AI:** [Genkit](https://firebase.google.com/docs/genkit) for AI-related functionalities.
- **Language:** [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing.

### Prerequisites

Make sure you have the following installed on your system:
- [Node.js](https://nodejs.org/en/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd <project-directory>
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    # yarn install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root of your project by copying the example file:
    ```bash
    cp .env.example .env
    ```
    Now, open the `.env` file and fill in the required values:
    ```env
    # The address of the main game smart contract
    NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

    # The address of the ANGLS token contract
    NEXT_PUBLIC_TOKEN_ADDRESS=0x...

    # The RPC URL for the Binance Smart Chain
    NEXT_PUBLIC_BSC_RPC_URL=https://bsc-dataseed.binance.org/
    ```

### Running the Application

To run the application in development mode, use the following command:
```bash
npm run dev
```
The application will be available at [http://localhost:9002](http://localhost:9002).

## 📜 Available Scripts

- `npm run dev`: Starts the development server with Turbopack.
- `npm run build`: Builds the application for production.
- `npm run start`: Starts a production server.
- `npm run lint`: Lints the project files using Next.js's built-in ESLint configuration.
- `npm run typecheck`: Runs the TypeScript compiler to check for type errors.
