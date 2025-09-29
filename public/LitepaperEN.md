# MakeMeRich, AI: Litepaper

## A Crowd Wisdom Utopian Money AI

### Introduction

**MakeMeRich (MMR)** is a decentralized economic experiment built on the principles of game theory, collective intelligence, and the radical transparency of the blockchain. We have created a system where each participant, by risking everything, influences the overall dynamics, and the contract's "artificial intelligence," based on rigid mathematical rules, determines the fate of the stakes.

This is an arena to test the hypothesis of whether collective greed and fear can create a self-balancing, sustainable, and ultimately profitable system for its participants.

---

### Core Mechanic: "All or Nothing"

At the heart of MMR AI lies a simple yet powerful rule:

1.  **Stake:** A player deposits tokens into the AI contract, placing their entire balance at stake.
2.  **Risk:** The user initiates the `makeMeRich` function. At this moment, their entire stake is on the line.
3.  **Outcome:** The contract's algorithm determines the outcome. The user either **doubles their stake** or **loses it all**.

The winnings are paid from the **AI Pool**, a special reserve within the contract. If the pool is insufficient to cover a win, the user receives the entire remainder of the pool. The lost stakes replenish this pool, creating a closed-loop economy.

### The "AI" of the Contract: Dynamic Risk Coefficient

The "AI" is not a neural network, but a set of transparent, predictable rules embedded in the smart contract that collectively create complex, emergent behavior. The central element is the **Risk Coefficient (K)**.

-   **What is K?** The Risk Coefficient is a dynamic value (`kUsed`) that directly determines a user's chance of winning. It fluctuates between a minimum (`kMin`) and a maximum (`kMax`) value.

-   **How is K calculated?** The base value of `K` depends on the ratio of the total system liquidity (all user deposits + AI Pool) to the user's current bet.
    -   **High Liquidity, Higher K:** When the system has a lot of liquidity compared to the user's bet, the `K` value trends towards its maximum (`kMax`). The system is "confident" and willing to offer better odds.
    -   **Low Liquidity, Lower K:** As a user's bet becomes a significant portion of the total liquidity, `K` trends towards its minimum (`kMin`). The system becomes more "cautious."

This creates a self-regulating mechanism: the system encourages smaller bets relative to its size and discourages attempts to drain it with a single large bet.

### The Human Factor: The Anti-Whale and Anti-Manipulation System

A purely mathematical system can be exploited. To counter this, we introduce a **Risk Penalty** system based on user behavior, adding a layer of "crowd wisdom."

-   **Penalty Logic:** The contract analyzes the user's recent winning history. If a user tries to make a new, significantly smaller bet immediately after a large win, the system imposes a **penalty** that reduces their `riskCoefficient`.
-   **Purpose:** This mechanism discourages "hit-and-run" tactics, where a user could win a large amount and then continue user with minimal risk, slowly bleeding the system. It forces user to either maintain a high level of risk commensurate with their previous success or to accept worse odds.

This is where the **collective intelligence** shines: the behavior of successful puserlayers directly influences the risk landscape for themselves, protecting the ecosystem from manipulative strategies.

### Cooldown and Minimum Bet

-   **Cooldown:** After each interaction (`makeMeRich`), a `cooldownDuration` is activated for the user. This prevents high-frequency automated trading and encourages more thoughtful decision-making.
-   **Dynamic Minimum Bet:** The minimum bet required to use is not static. It is calculated as the greater of a base `absoluteMin` value or **half of the user's biggest win in the last 24 hours** (`maxWinBet24h`). This forces users who have recently won big to continue interacting with significant stakes, contributing back to the system's risk and liquidity.

---

### Economic Model and Vision

MMR is a zero-sum game only in the short term. In the long term, it is a system for redistributing value based on risk appetite and timing.

-   **The AI Pool** acts as a buffer and a source of winnings. It is filled by lost bets and can be supplemented by the project owners (`fundAIPool`).
-   **User Deposits** (`totalDeposits`) form the active liquidity of the system.
-   **Fees:** A small commission on withdrawals (`feePercent`) is directed to the `feeRecipient`, ensuring the project's operational sustainability without interfering with the core app mechanics.

Our vision is to create a financial "primordial soup" where the simplest rules of risk and reward give rise to complex economic behavior. MMR is a transparent, immutable experiment in decentralized finance, where every participant is both a user and a vital part of the system's "crowd wisdom AI."

**Risk everything. Trust the code. Become part of the experiment.**