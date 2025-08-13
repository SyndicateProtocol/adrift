# Claude.md - Last Person Standing Contracts

## Project Overview

This is a Foundry-based smart contract project for a "Last Person Standing" game where players must check in regularly to avoid disqualification.

## Contract Architecture

### Core Contracts

- **Adrift.sol**: Main game contract with registration, check-in, and disqualification logic
- **AdriftFactory.sol**: Factory contract for deploying new game instances
- **CheckinOutcomes.sol**: Contract for determining random check-in outcomes (placeholder)
- **CheckinOutcomesFactory.sol**: Factory for CheckinOutcomes contracts

### Key Features

- Players register before game starts
- 24-hour check-in intervals required
- Access control with game admin role
- Winner determination when only one player remains
- Events for all major actions (registration, check-ins, disqualifications)

## Development Setup

### Commands

- `forge test` - Run tests
- `forge fmt` - Format Solidity code
- `forge build` - Compile contracts

### Testing

- Basic test exists in `test/Adrift.t.sol`
- Test verifies `isGameActive()` returns false by default

## Deployment Information

### Deployed Contracts (Pacifica Testnet)

- **AdriftFactory**: `0xA0E8Ee80b1Ae18Cd2aFC844502B72abC7f0EEA8D`
- **Adrift** (via factory): `0x1d807Ccd428b6eE4D6Cfd8f934eB9E019d0d12d0`

### Deployment Details

- Network: Pacifica Testnet (Syndicate)
- RPC URL: `https://pacifica.rpc.testnet.syndicate.io/`
- Explorer: `https://pacifica.explorer.testnet.syndicate.io/`
- Game Admin: `0x3A7B397CC8fE3A5295ef100829729C58dBAfc94a`

### Verification

Both contracts have been verified on Blockscout:

- Factory: https://pacifica.explorer.testnet.syndicate.io/address/0xA0E8Ee80b1Ae18Cd2aFC844502B72abC7f0EEA8D
- Game: https://pacifica.explorer.testnet.syndicate.io/address/0x1d807Ccd428b6eE4D6Cfd8f934eB9E019d0d12d0

## GitHub Actions

### CI/CD Configuration

- Workflow file: `.github/workflows/test.yml`
- Working directory set to `contracts/`
- Runs: forge fmt check, forge build, forge test
- Uses `--skip "*/lib/*"` pattern to ignore dependency formatting

## Project Structure

### Monorepo Layout

```
├── contracts/          # Foundry project
│   ├── src/           # Smart contracts
│   ├── test/          # Contract tests
│   ├── lib/           # Dependencies (forge-std, openzeppelin)
│   └── foundry.toml   # Foundry configuration
├── apps/
│   ├── site/          # Next.js frontend
│   └── indexer/       # Ponder indexer
```

## Key Learnings

### Factory Pattern

- Added `GameCreated` event to factory for easy tracking of deployed contracts
- Event logs provide clear contract addresses: `topics[1]` contains deployed address

### Deployment Best Practices

- Use `--broadcast` flag for actual deployment (not dry run)
- Include constructor args for contract verification
- Verify contracts immediately after deployment

### Git Workflow

- **Rebase** is preferred over merge for long-running branches into rapidly changing main
- Avoids messy merge commits and maintains clean linear history
- Use `git rebase origin/main` instead of `git merge origin/main`

### Forge Commands Used

```bash
# Deploy contract
forge create src/Contract.sol:Contract --private-key <key> --rpc-url <url> --broadcast

# Verify contract
forge verify-contract --rpc-url <url> --verifier blockscout --verifier-url <url> <address> src/Contract.sol:Contract

# Call contract function
cast send <address> "function()" --private-key <key> --rpc-url <url>

# Format code
forge fmt

# Run tests
forge test
```
