# Adrift

Adrift is a decentralized game built on Syndicate's sequencing infrastructure. The project consists of two main categories of contracts deployed across different chains, along with a complete full-stack application.

## Architecture Overview

Adrift uses a cross-chain architecture to separate game logic from transaction sequencing, enabling high throughput and efficient gas usage.

### 🎮 Game Chain Contracts (Pacifica)
These contracts handle the core game logic and player interactions:
- **Adrift.sol** - Main game contract with winner determination
- **AdriftForever.sol** - Perpetual game version without end conditions
- **AdriftFactory.sol** - Factory for deploying game instances
- **CheckInOutcomes.sol** - Manages random outcomes for player check-ins
- **CheckInOutcomesFactory.sol** - Factory for deploying outcome contracts
- **Random.sol** - Provides verifiable randomness for the game

### ⚡ Sequencing Chain Contracts (Risa)
These contracts handle transaction sequencing and compression:
- **AdriftBundler.sol** - Bundles and sequences game transactions
- **Decompressor.sol** - Decompresses zlib-compressed RLP transaction data
- **RLPTxBreakdown.sol** - Utilities for decoding RLP transaction data
- **RLPReader.sol** - RLP decoding utilities

## Game Mechanics

### Core Game Loop
1. Players register by calling `register()` on the game contract
2. Players must check in every 24 hours to remain active
3. Check-ins have random outcomes that can buff/debuff next check-in times
4. Players who miss check-ins or get negative outcomes are disqualified
5. Last player standing wins (in Adrift.sol) or game continues indefinitely (in AdriftForever.sol)

### Check-in System
- **Grace Period**: 1 hour window before next check-in where players can check in safely
- **Risk/Reward**: Early check-ins increase both risk of disqualification and potential rewards
- **Random Outcomes**: Each check-in has a random outcome affecting the next check-in time

## System Architecture

### Cross-Chain Design
The application uses a sophisticated cross-chain architecture to optimize performance and cost:

**Game Chain (Pacifica):**
- Handles core game logic and state management
- Processes player registrations and check-ins
- Manages game outcomes and disqualifications
- Provides verifiable randomness integration

**Sequencing Chain (Risa):**
- Bundles multiple transactions into single sequencing transactions
- Compresses transaction data for gas efficiency
- Processes transactions in order with randomness integration
- Handles high-throughput transaction processing

### Application Components

**Frontend (Next.js):**
- Modern web interface built with React and Tailwind CSS
- Integrates with Para wallet for seamless user experience
- Real-time game state updates via indexer
- Responsive design for mobile and desktop

**Indexer (Ponder):**
- Monitors blockchain events across both chains
- Stores indexed data in PostgreSQL database
- Provides GraphQL API for frontend consumption
- Handles real-time data synchronization

**Database (PostgreSQL):**
- Stores game state, player data, and transaction history
- Optimized for read-heavy workloads
- Supports complex queries for leaderboards and analytics

**Cron Jobs:**
- Automated maintenance and monitoring tasks
- Health checks and system monitoring
- Periodic data cleanup and optimization

### External Integrations

**Syndicate Transaction Cloud:**
- Handles automated transaction processing
- Manages player disqualification automation
- Provides reliable transaction sequencing

**Para Wallet:**
- Seamless wallet integration for users
- Supports multiple wallet types
- Handles transaction signing and submission

**Lit Protocol:**
- Programmable Key Pair (PKP) authentication
- Secure key management for automated processes
- Enhanced security for critical operations

## Project Structure
```
adrift/
├── apps/
│   ├── indexer/         # Ponder indexer
│   ├── site/            # Next.js frontend application
│   └── cron/            # Automated tasks
├── contracts/
│   ├── foundry/         # Solidity smart contracts
│   └── stylus-decompressor/  # Rust Stylus contracts
└── package.json         # Monorepo configuration
```


## Deployed Contracts

### Pacifica (Appchain): For Docs

| Contract Name                 | Address                                                                                                                       |
| ----------------------------  | ----------------------------------------------------------------------------------------------------------------------------- |
| AdriftFactory                 | [0xe4D5693E21EE66a9a9b3f513Ae6822B38424A072](https://pacifica.explorer.testnet.syndicate.io/address/0xe4D5693E21EE66a9a9b3f513Ae6822B38424A072) |
| CheckInOutcomesFactory        | [0x9fDf06F9CC62829795dADB60a71db44A348308f2](https://pacifica.explorer.testnet.syndicate.io/address/0x9fDf06F9CC62829795dADB60a71db44A348308f2) |
| Random                        | [0xc75954B9B4Bb4B80883Cf645744612138b7e4870](https://pacifica.explorer.testnet.syndicate.io/address/0xc75954B9B4Bb4B80883Cf645744612138b7e4870) |
| CheckInOutcomes               | [0x70068b12F915545abDC610bE2aCDC4443fb6b0a2](https://pacifica.explorer.testnet.syndicate.io/address/0x70068b12F915545abDC610bE2aCDC4443fb6b0a2) |
| AdriftForever                 | [0x7AC97BCf8fA1A7618128da7269a9f6C3c10D8a43](https://pacifica.explorer.testnet.syndicate.io/address/0x7AC97BCf8fA1A7618128da7269a9f6C3c10D8a43) |

### Pacifica (Appchain): Production

| Contract Name                 | Address                                                                                                                       |
| ----------------------------  | ----------------------------------------------------------------------------------------------------------------------------- |
| CheckInOutcomesFactory        | [0xC57E25881fda73f017C3D7c1308d00B1a358409e](https://pacifica.explorer.testnet.syndicate.io/address/0xC57E25881fda73f017C3D7c1308d00B1a358409e) |
| Random                        | [0xc75954B9B4Bb4B80883Cf645744612138b7e4870](https://pacifica.explorer.testnet.syndicate.io/address/0xc75954B9B4Bb4B80883Cf645744612138b7e4870) |
| CheckInOutcomes               | [0xB102580A9eb72f4Ec5fA12C85CCFB30D5C016Ff0](https://pacifica.explorer.testnet.syndicate.io/address/0xB102580A9eb72f4Ec5fA12C85CCFB30D5C016Ff0) |
| Adrift                        | [0xcd15C8A1aBD28d46E7B6184A848DA9f9cFCda628](https://pacifica.explorer.testnet.syndicate.io/address/0xcd15C8A1aBD28d46E7B6184A848DA9f9cFCda628) |
| AdriftFactory                 | [0x3e3bfe9a911E7742fd65da7807773b4CD2e2B4Fd](https://pacifica.explorer.testnet.syndicate.io/address/0x3e3bfe9a911E7742fd65da7807773b4CD2e2B4Fd) |
| Adrift (Hotfixed)             | [0x5F77E9be64D1DdA9d2c0FcB8a1E0d8c1E867ECa2](https://pacifica.explorer.testnet.syndicate.io/address/0x5F77E9be64D1DdA9d2c0FcB8a1E0d8c1E867ECa2) |
| AdriftFactory (Hotfixed)      | [0xf5c324Cd9fbA1cD5D35F131C2eA7808A55942DE1](https://pacifica.explorer.testnet.syndicate.io/address/0xf5c324Cd9fbA1cD5D35F131C2eA7808A55942DE1) |

### Risa (Sequencing Chain)
| Contract Name                 | Address                                                                                                                       |
| ----------------------------  | ----------------------------------------------------------------------------------------------------------------------------- |
| AdriftBundler                 | [0xC2d64dE482582964da315a27093fBdBc72c874CB](https://risa-testnet.explorer.alchemy.com/address/0xC2d64dE482582964da315a27093fBdBc72c874CB) |
| Decompressor                  | [0x5d3f5fc4129290b11ac6ed9bbc99cf11a79a5ef0](https://risa-testnet.explorer.alchemy.com/address/0x5d3f5fc4129290b11ac6ed9bbc99cf11a79a5ef0) |

## License

MIT License - see LICENSE file for details

