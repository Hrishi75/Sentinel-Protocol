import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import idl from "./sentinel_protocol.json";

export const PROGRAM_ID = new PublicKey(
  "5DCbrjFHUdzLHLayUUdFJBnBPC8UV7eUc3wJA1rVRQTa"
);

// PDA Seeds
const AGENT_SEED = Buffer.from("agent");
const CELL_SEED = Buffer.from("cell");
const BAIL_SEED = Buffer.from("bail");
const DAO_SEED = Buffer.from("sentinel_dao");
const VAULT_SEED = Buffer.from("vault");
const BAIL_VAULT_SEED = Buffer.from("bail_vault");
const INSURANCE_POOL_SEED = Buffer.from("insurance_pool");
const INSURANCE_POLICY_SEED = Buffer.from("insurance_policy");
const INSURANCE_VAULT_SEED = Buffer.from("insurance_vault");
const INSURANCE_CLAIM_SEED = Buffer.from("insurance_claim");

// PDA Derivation
export function findAgentRecordPda(agentPubkey: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [AGENT_SEED, agentPubkey.toBuffer()],
    PROGRAM_ID
  );
}

export function findCellPda(agentRecordPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [CELL_SEED, agentRecordPda.toBuffer()],
    PROGRAM_ID
  );
}

export function findBailRequestPda(cellPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BAIL_SEED, cellPda.toBuffer()],
    PROGRAM_ID
  );
}

export function findSentinelDaoPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([DAO_SEED], PROGRAM_ID);
}

export function findVaultPda(agentRecordPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [VAULT_SEED, agentRecordPda.toBuffer()],
    PROGRAM_ID
  );
}

export function findBailVaultPda(
  bailRequestPda: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [BAIL_VAULT_SEED, bailRequestPda.toBuffer()],
    PROGRAM_ID
  );
}

// Program Provider
export function getProvider(
  connection: Connection,
  wallet: AnchorWallet
): AnchorProvider {
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getProgram(provider: AnchorProvider): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(idl as any, provider);
}

// --- Instruction Builders ---

export async function registerAgent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  owner: PublicKey,
  agentKeypair: Keypair,
  permissions: {
    maxTransferLamports: BN;
    allowedPrograms: PublicKey[];
    maxDailyTransactions: number;
  },
  stakeAmount: BN
) {
  const [agentRecord] = findAgentRecordPda(agentKeypair.publicKey);
  const [vault] = findVaultPda(agentRecord);

  return program.methods
    .registerAgent(permissions, stakeAmount)
    .accounts({
      owner,
      agentIdentity: agentKeypair.publicKey,
      agentRecord,
      vault,
      systemProgram: SystemProgram.programId,
    })
    .signers([agentKeypair])
    .rpc();
}

export async function arrestAgent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  arrester: PublicKey,
  agentIdentity: PublicKey,
  reason: string,
  evidenceHash: number[],
  violationType: object
) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [cell] = findCellPda(agentRecord);
  const [sentinelDao] = findSentinelDaoPda();

  return program.methods
    .arrestAgent(reason, evidenceHash, violationType)
    .accounts({
      arrester,
      agentRecord,
      cell,
      sentinelDao,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function postBail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  owner: PublicKey,
  agentIdentity: PublicKey,
  bailAmount: BN
) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [cell] = findCellPda(agentRecord);
  const [bailRequest] = findBailRequestPda(cell);
  const [bailVault] = findBailVaultPda(bailRequest);
  const [sentinelDao] = findSentinelDaoPda();

  return program.methods
    .postBail(bailAmount)
    .accounts({
      owner,
      agentRecord,
      cell,
      bailRequest,
      bailVault,
      sentinelDao,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function castVote(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  voter: PublicKey,
  agentIdentity: PublicKey,
  decision: object
) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [cell] = findCellPda(agentRecord);
  const [bailRequest] = findBailRequestPda(cell);
  const [sentinelDao] = findSentinelDaoPda();

  return program.methods
    .castVote(decision)
    .accounts({
      voter,
      bailRequest,
      cell,
      agentRecord,
      sentinelDao,
    })
    .rpc();
}

export async function releaseAgent(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  authority: PublicKey,
  agentIdentity: PublicKey,
  ownerPubkey: PublicKey,
  treasuryPubkey: PublicKey
) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [cell] = findCellPda(agentRecord);
  const [bailRequest] = findBailRequestPda(cell);
  const [bailVault] = findBailVaultPda(bailRequest);
  const [stakeVault] = findVaultPda(agentRecord);
  const [sentinelDao] = findSentinelDaoPda();

  return program.methods
    .releaseAgent()
    .accounts({
      authority,
      agentRecord,
      cell,
      bailRequest,
      bailVault,
      stakeVault,
      owner: ownerPubkey,
      sentinelDao,
      treasury: treasuryPubkey,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

// --- Account Fetchers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAllAgents(program: any) {
  return program.account.agentRecord.all();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAgent(program: any, agentIdentity: PublicKey) {
  const [pda] = findAgentRecordPda(agentIdentity);
  return program.account.agentRecord.fetch(pda);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchDao(program: any) {
  const [pda] = findSentinelDaoPda();
  return program.account.sentinelDao.fetch(pda);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchCell(program: any, agentIdentity: PublicKey) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [cellPda] = findCellPda(agentRecord);
  return program.account.cell.fetch(cellPda);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchBailRequest(program: any, agentIdentity: PublicKey) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [cell] = findCellPda(agentRecord);
  const [bailPda] = findBailRequestPda(cell);
  return program.account.bailRequest.fetch(bailPda);
}

export async function processPayment(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  payer: PublicKey,
  agentIdentity: PublicKey,
  amount: BN
) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [sentinelDao] = findSentinelDaoPda();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dao = await program.account.sentinelDao.fetch(sentinelDao) as any;

  return program.methods
    .processPayment(amount)
    .accounts({
      payer,
      agentRecord,
      sentinelDao,
      treasury: dao.treasury,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

// --- Insurance PDA Derivation ---

export function findInsurancePoolPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([INSURANCE_POOL_SEED], PROGRAM_ID);
}

export function findInsurancePolicyPda(agentRecordPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [INSURANCE_POLICY_SEED, agentRecordPda.toBuffer()],
    PROGRAM_ID
  );
}

export function findInsuranceVaultPda(insurancePoolPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [INSURANCE_VAULT_SEED, insurancePoolPda.toBuffer()],
    PROGRAM_ID
  );
}

export function findInsuranceClaimPda(insurancePolicyPda: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [INSURANCE_CLAIM_SEED, insurancePolicyPda.toBuffer()],
    PROGRAM_ID
  );
}

// --- Insurance Instruction Builders ---

export async function buyCoverage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  owner: PublicKey,
  agentIdentity: PublicKey,
  tier: object
) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [insurancePolicy] = findInsurancePolicyPda(agentRecord);
  const [insurancePool] = findInsurancePoolPda();
  const [insuranceVault] = findInsuranceVaultPda(insurancePool);

  return program.methods
    .buyCoverage(tier)
    .accounts({
      owner,
      agentRecord,
      insurancePolicy,
      insurancePool,
      insuranceVault,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function fileClaim(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  owner: PublicKey,
  agentIdentity: PublicKey
) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [insurancePolicy] = findInsurancePolicyPda(agentRecord);
  const [insuranceClaim] = findInsuranceClaimPda(insurancePolicy);
  const [insurancePool] = findInsurancePoolPda();
  const [insuranceVault] = findInsuranceVaultPda(insurancePool);

  return program.methods
    .fileClaim()
    .accounts({
      owner,
      agentRecord,
      insurancePolicy,
      insuranceClaim,
      insurancePool,
      insuranceVault,
      systemProgram: SystemProgram.programId,
    })
    .rpc();
}

export async function cancelCoverage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  owner: PublicKey,
  agentRecordPda: PublicKey
) {
  const [insurancePolicy] = findInsurancePolicyPda(agentRecordPda);
  const [insurancePool] = findInsurancePoolPda();

  return program.methods
    .cancelCoverage()
    .accounts({
      owner,
      insurancePolicy,
      insurancePool,
    })
    .rpc();
}

// --- Insurance Fetchers ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchInsurancePool(program: any) {
  const [pda] = findInsurancePoolPda();
  return program.account.insurancePool.fetch(pda);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchInsurancePolicy(program: any, agentIdentity: PublicKey) {
  const [agentRecord] = findAgentRecordPda(agentIdentity);
  const [policyPda] = findInsurancePolicyPda(agentRecord);
  return program.account.insurancePolicy.fetch(policyPda);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function fetchAllPolicies(program: any) {
  return program.account.insurancePolicy.all();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTierString(tier: any): "Basic" | "Standard" | "Premium" {
  if ("basic" in tier) return "Basic";
  if ("standard" in tier) return "Standard";
  if ("premium" in tier) return "Premium";
  return "Basic";
}

// Status helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getStatusString(status: any): "Active" | "Arrested" | "Paroled" | "Terminated" {
  if ("active" in status) return "Active";
  if ("arrested" in status) return "Arrested";
  if ("paroled" in status) return "Paroled";
  if ("terminated" in status) return "Terminated";
  return "Active";
}
