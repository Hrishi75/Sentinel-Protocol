#!/bin/bash
set -e

echo "========================================"
echo "  WARDEN PROTOCOL — SOLANA DEPLOYER"
echo "========================================"

# Check if a wallet keypair was mounted
if [ -f /warden/wallet/id.json ]; then
    echo "[+] Using mounted wallet keypair"
    solana config set --keypair /warden/wallet/id.json
else
    echo "[+] No wallet found, generating new keypair..."
    solana-keygen new --no-bip39-passphrase --outfile /warden/wallet/id.json --force
    solana config set --keypair /warden/wallet/id.json
fi

# Set cluster
CLUSTER=${SOLANA_CLUSTER:-devnet}
echo "[+] Cluster: $CLUSTER"
solana config set --url $CLUSTER

# Show wallet address
WALLET=$(solana address)
echo "[+] Wallet: $WALLET"

# Check balance
BALANCE=$(solana balance | awk '{print $1}')
echo "[+] Balance: $BALANCE SOL"

# Airdrop if devnet and balance is low
if [ "$CLUSTER" = "devnet" ]; then
    if (( $(echo "$BALANCE < 2" | bc -l) )); then
        echo "[+] Balance low, requesting airdrop..."
        solana airdrop 2 || echo "[!] Airdrop failed — use https://faucet.solana.com"
        sleep 2
        solana airdrop 2 || true
        sleep 2
    fi
fi

echo "[+] Building program..."
anchor build

# Verify program keypair
PROGRAM_KEY=$(solana address -k target/deploy/warden_protocol-keypair.json)
echo "[+] Program ID: $PROGRAM_KEY"

# Check if already deployed
echo "[+] Checking if program is already deployed..."
if solana program show $PROGRAM_KEY 2>/dev/null | grep -q "Program Id"; then
    echo "[+] Program already deployed, upgrading..."
    anchor upgrade target/deploy/warden_protocol.so --program-id $PROGRAM_KEY --provider.cluster $CLUSTER
else
    echo "[+] Deploying program to $CLUSTER..."
    anchor deploy --provider.cluster $CLUSTER
fi

echo ""
echo "========================================"
echo "  DEPLOYMENT COMPLETE"
echo "  Program ID: $PROGRAM_KEY"
echo "  Cluster:    $CLUSTER"
echo "  Explorer:   https://explorer.solana.com/address/${PROGRAM_KEY}?cluster=${CLUSTER}"
echo "========================================"

# Copy IDL for frontend to pick up
if [ -d /warden/shared ]; then
    cp target/idl/warden_protocol.json /warden/shared/
    cp target/types/warden_protocol.ts /warden/shared/
    echo "[+] IDL copied to shared volume"
fi

# Run tests if requested
if [ "$RUN_TESTS" = "true" ]; then
    echo "[+] Running tests..."
    anchor test --skip-deploy --provider.cluster $CLUSTER
fi

echo "[+] Done. Container staying alive for inspection..."
tail -f /dev/null