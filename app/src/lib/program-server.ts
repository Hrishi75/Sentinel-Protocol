import { AnchorProvider, Program } from "@coral-xyz/anchor";
import { Connection, Keypair, Transaction, VersionedTransaction } from "@solana/web3.js";
import { getStatusString } from "./program";
import idl from "./sentinel_protocol.json";

/** Minimal wallet implementation for server-side read-only access. */
const dummyKeypair = Keypair.generate();
const DUMMY_WALLET = {
  publicKey: dummyKeypair.publicKey,
  signTransaction: <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => Promise.resolve(tx),
  signAllTransactions: <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => Promise.resolve(txs),
};

function getConnection(): Connection {
  const rpc =
    process.env.NEXT_PUBLIC_RPC_ENDPOINT || "https://api.devnet.solana.com";
  return new Connection(rpc, "confirmed");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getReadOnlyProgram(): any {
  const connection = getConnection();
  const provider = new AnchorProvider(connection, DUMMY_WALLET, {
    commitment: "confirmed",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(idl as any, provider);
}

export interface OnChainAgent {
  publicKey: string;
  agentIdentity: string;
  owner: string;
  stakeAmount: bigint;
  status: string;
  maxTransferLamports: bigint;
  maxDailyTransactions: number;
  registeredAt: bigint;
  violations: {
    violationType: string;
    evidenceHash: string;
    description: string;
    timestamp: bigint;
  }[];
}

export interface OnChainBailRequest {
  publicKey: string;
  cellPda: string;
  agentIdentity: string;
  owner: string;
  bailAmount: bigint;
  postedAt: bigint;
  reviewDeadline: bigint;
  outcome: string;
  votesCount: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getViolationTypeString(vt: any): string {
  if ("exceededTransferLimit" in vt) return "ExceededTransferLimit";
  if ("unauthorizedProgram" in vt) return "UnauthorizedProgram";
  if ("rateLimitBreached" in vt) return "RateLimitBreached";
  if ("paroleViolation" in vt) return "ParoleViolation";
  return "Other";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBailOutcomeString(outcome: any): string {
  if ("pending" in outcome) return "Pending";
  if ("released" in outcome) return "Released";
  if ("paroled" in outcome) return "Paroled";
  if ("terminated" in outcome) return "Terminated";
  return "Pending";
}

export async function fetchAllAgentsOnChain(): Promise<OnChainAgent[]> {
  const program = getReadOnlyProgram();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts: any[] = await program.account.agentRecord.all();

  return accounts.map((acc) => ({
    publicKey: acc.publicKey.toBase58(),
    agentIdentity: acc.account.agentIdentity.toBase58(),
    owner: acc.account.owner.toBase58(),
    stakeAmount: BigInt(acc.account.stakeAmount.toString()),
    status: getStatusString(acc.account.status),
    maxTransferLamports: BigInt(
      acc.account.permissions.maxTransferLamports.toString()
    ),
    maxDailyTransactions: acc.account.permissions.maxDailyTransactions,
    registeredAt: BigInt(acc.account.registeredAt.toString()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    violations: (acc.account.violations || []).map((v: any) => ({
      violationType: getViolationTypeString(v.violationType),
      evidenceHash: Buffer.from(v.evidenceHash).toString("hex"),
      description: v.description,
      timestamp: BigInt(v.timestamp.toString()),
    })),
  }));
}

export async function fetchAllBailRequestsOnChain(): Promise<
  OnChainBailRequest[]
> {
  const program = getReadOnlyProgram();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const accounts: any[] = await program.account.bailRequest.all();

  return accounts.map((acc) => ({
    publicKey: acc.publicKey.toBase58(),
    cellPda: acc.account.cell.toBase58(),
    agentIdentity: acc.account.agent.toBase58(),
    owner: acc.account.owner.toBase58(),
    bailAmount: BigInt(acc.account.bailAmount.toString()),
    postedAt: BigInt(acc.account.postedAt.toString()),
    reviewDeadline: BigInt(acc.account.reviewDeadline.toString()),
    outcome: getBailOutcomeString(acc.account.outcome),
    votesCount: acc.account.votes?.length || 0,
  }));
}

export async function getCurrentSlot(): Promise<bigint> {
  const connection = getConnection();
  const slot = await connection.getSlot("confirmed");
  return BigInt(slot);
}
