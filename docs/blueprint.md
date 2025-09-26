# **App Name**: MakeMeRich Game UI

## Core Features:

- Web3 Authentication: Authenticate users using their Web3 wallet (e.g., MetaMask).
- Contract & Token Setup: Configure the contract address and custom token address using values from a `.env` file.
- Token Balance Display: Display the user's custom token balance from their connected wallet.
- Game Data Display: Fetch and display game data from the `getGameData` method of the smart contract, showing `playerBalance`, `totalPool_`, `numberOfPlayers`, `minBet`, and `riskCoefficient`.
- Deposit Functionality: Allow users to deposit tokens into the smart contract using a deposit button and input field.
- Withdraw Functionality: Enable users to withdraw tokens from the smart contract, with separate buttons for withdrawing a specific amount and withdrawing all available tokens.
- MAKE ME RICH! Button: Implement a button that triggers the `makeMeRich` function on the smart contract.

## Style Guidelines:

- Background color: White for a clean and modern look.
- Font color: Black for excellent readability and contrast.
- Accent color: #e5c44f to highlight important elements and call-to-action buttons.
- Body: 'Inter', a sans-serif font with a neutral look, suitable for body text.
- Headlines: 'Space Grotesk' a sans-serif font with techy feel.
- Use simple, clear icons to represent different actions and data points.
- Subtle transitions and animations to provide feedback on user interactions.