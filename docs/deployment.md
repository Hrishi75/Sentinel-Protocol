# Deployment Guide

Build and deploy the Solana program, then verify Program ID consistency.
## Deploying the Program


### Step 1: Build

```bash
anchor build
```

This produces:
- `target/deploy/sentinel_protocol.so` — Deployable BPF binary
- `target/deploy/sentinel_protocol-keypair.json` — Program keypair
- `target/idl/sentinel_protocol.json` — IDL for client generation
- `target/types/sentinel_protocol.ts` — TypeScript types

### Step 2: Verify Program ID

```bash
solana address -k target/deploy/sentinel_protocol-keypair.json
```

This should output:
```
5DCbrjFHUdzLHLayUUdFJBnBPC8UV7eUc3wJA1rVRQTa
```

If it's **different**, update the ID in three places:

| File | Location |
|------|----------|
| `Anchor.toml` | Line 8: `sentinel_protocol = "YOUR_ID"` |
| `programs/sentinel-protocol/src/lib.rs` | Line 11: `declare_id!("YOUR_ID")` |
| `app/src/lib/program.ts` | Line 7-9: `PROGRAM_ID = new PublicKey("YOUR_ID")` |

Then rebuild: `anchor build`

### Step 3: Deploy

```bash
anchor deploy
```

Expected output:
```
Deploying program "sentinel_protocol"...
Program Id: 5DCbrjFHUdzLHLayUUdFJBnBPC8UV7eUc3wJA1rVRQTa
Deploy success
```

### Step 4: Verify on Explorer

Open in browser:
```
https://explorer.solana.com/address/5DCbrjFHUdzLHLayUUdFJBnBPC8UV7eUc3wJA1rVRQTa?cluster=devnet
```

### Upgrading an Existing Deployment

```bash
anchor upgrade target/deploy/sentinel_protocol.so \
  --program-id 5DCbrjFHUdzLHLayUUdFJBnBPC8UV7eUc3wJA1rVRQTa \
  --provider.cluster devnet
```

---

## Program ID


```
5DCbrjFHUdzLHLayUUdFJBnBPC8UV7eUc3wJA1rVRQTa
```

Defined in:
- `programs/sentinel-protocol/src/lib.rs` — `declare_id!` macro
- `app/src/lib/program.ts` — Frontend `PROGRAM_ID`
- `Anchor.toml` — Anchor config

