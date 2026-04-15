# @sentinel-protocol/sdk

TypeScript SDK for interacting with the Sentinel Protocol on Solana.

## Installation

### From GitHub Packages

Add a `.npmrc` to your project:

```
@sentinel-protocol:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then install:

```bash
npm install @sentinel-protocol/sdk
```

### From Source (local development)

```bash
cd sdk
npm install
npm run build
```

Then in your consuming project's `package.json`:

```json
{
  "dependencies": {
    "@sentinel-protocol/sdk": "file:../sdk"
  }
}
```

## Quick Start

### With a wallet (full access)

```typescript
import { SentinelClient } from "@sentinel-protocol/sdk";
import { Connection, Keypair } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

const client = new SentinelClient({
  connection: new Connection("https://api.devnet.solana.com"),
  wallet: yourWalletAdapter,
});

// Register an AI agent
const agentKeypair = Keypair.generate();
await client.registerAgent(
  owner.publicKey,
  agentKeypair,
  {
    maxTransferLamports: new BN(1_000_000_000),
    allowedPrograms: [],
    maxDailyTransactions: 100,
  },
  new BN(5_000_000_000) // 5 SOL stake
);

// Fetch all agents
const agents = await client.fetchAllAgents();
```

### Read-only access (no wallet needed)

```typescript
import { SentinelClient } from "@sentinel-protocol/sdk";
import { Connection } from "@solana/web3.js";

const reader = SentinelClient.readOnly(
  new Connection("https://api.devnet.solana.com")
);

const dao = await reader.fetchDao();
const agents = await reader.fetchAllAgents();
const pool = await reader.fetchInsurancePool();
```

## API Reference

### SentinelClient

#### Constructor

```typescript
new SentinelClient({
  connection: Connection,
  wallet: WalletAdapter,
  programId?: PublicKey,     // defaults to deployed program ID
  commitment?: Commitment,   // defaults to "confirmed"
})
```

#### Static Methods

| Method | Description |
|--------|-------------|
| `SentinelClient.readOnly(connection, programId?)` | Create a read-only client (no wallet needed) |

#### Instructions

| Method | Description |
|--------|-------------|
| `initDao(authority, treasury, voteThreshold, reviewWindow, minBail, slashPct, members)` | Initialize the governance DAO |
| `registerAgent(owner, agentKeypair, permissions, stakeAmount)` | Register an AI agent with stake |
| `arrestAgent(arrester, agentIdentity, reason, evidenceHash, violationType)` | Arrest a misbehaving agent |
| `freezeAgentToken(authority, agentIdentity, tokenAccount, mint)` | Freeze an arrested agent's token account |
| `postBail(owner, agentIdentity, bailAmount)` | Post bail for an arrested agent |
| `castVote(voter, agentIdentity, decision)` | DAO member votes on bail request |
| `releaseAgent(authority, agentIdentity, owner, treasury)` | Execute bail outcome |
| `reportViolation(reporter, agentIdentity, violationType, evidenceHash, description)` | Report a parole violation |
| `checkProbation(caller, agentIdentity)` | Check if probation has ended |
| `processPayment(payer, agentIdentity, amount)` | Process payment (0.3% fee) |
| `buyCoverage(owner, agentIdentity, tier)` | Buy insurance coverage |
| `fileClaim(owner, agentIdentity)` | File insurance claim |
| `cancelCoverage(owner, agentRecordPda)` | Cancel insurance policy |
| `initInsurancePool(authority)` | Initialize the insurance pool |

#### Account Fetchers

| Method | Returns |
|--------|---------|
| `fetchAllAgents()` | All registered agents |
| `fetchAgent(agentIdentity)` | Single agent record |
| `fetchDao()` | DAO governance state |
| `fetchCell(agentIdentity)` | Arrest cell for an agent |
| `fetchBailRequest(agentIdentity)` | Bail request for an agent |
| `fetchInsurancePool()` | Insurance pool state |
| `fetchInsurancePolicy(agentIdentity)` | Agent's insurance policy |
| `fetchAllPolicies()` | All insurance policies |

#### PDA Helpers

| Method | PDA |
|--------|-----|
| `findAgentRecordPda(agentPubkey)` | Agent record |
| `findCellPda(agentRecordPda)` | Arrest cell |
| `findBailRequestPda(cellPda)` | Bail request |
| `findSentinelDaoPda()` | DAO singleton |
| `findVaultPda(agentRecordPda)` | Stake vault |
| `findBailVaultPda(bailRequestPda)` | Bail escrow |
| `findInsurancePoolPda()` | Insurance pool |
| `findInsurancePolicyPda(agentRecordPda)` | Insurance policy |
| `findInsuranceVaultPda(insurancePoolPda)` | Insurance vault |
| `findInsuranceClaimPda(insurancePolicyPda)` | Insurance claim |

### Standalone Functions

All methods are also available as standalone functions:

```typescript
import {
  registerAgent,
  fetchAllAgents,
  findAgentRecordPda,
  getStatusString,
} from "@sentinel-protocol/sdk";

// Pass an Anchor program instance directly
await registerAgent(program, owner, agentKeypair, permissions, stakeAmount);
const agents = await fetchAllAgents(program);
const [pda, bump] = findAgentRecordPda(agentPubkey, programId);
```

### Types

```typescript
import type {
  AgentRecord,
  Cell,
  BailRequest,
  SentinelDao,
  InsurancePolicy,
  InsurancePool,
  InsuranceClaim,
  PermissionScope,
  Violation,
  ParoleTerms,
  Vote,
  DaoMember,
} from "@sentinel-protocol/sdk";

import {
  AgentStatus,
  ViolationType,
  BailOutcome,
  InsuranceTier,
  ClaimStatus,
} from "@sentinel-protocol/sdk";
```

### Helpers

```typescript
import {
  getStatusString,
  getTierString,
  getBailOutcomeString,
  getViolationTypeString,
} from "@sentinel-protocol/sdk";

// Convert Anchor enum variants to strings
getStatusString({ active: {} });     // "Active"
getTierString({ premium: {} });      // "Premium"
getBailOutcomeString({ paroled: {} }); // "Paroled"
```

## Publishing

The SDK is published to GitHub Packages via GitHub Actions.

### Automatic (via git tag)

```bash
git tag sdk-v0.2.0
git push origin sdk-v0.2.0
```

### Manual

```bash
cd sdk
npm run build
npm publish
```

## Development

```bash
cd sdk
npm install
npm run build    # Build CJS + ESM + types
npm run clean    # Remove dist/
```

## License

MIT
