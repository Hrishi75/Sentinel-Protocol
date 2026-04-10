"use client";

import { useEffect, useState } from "react";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { AnchorProvider, Program, Wallet } from "@coral-xyz/anchor";
import { Keypair } from "@solana/web3.js";
import idl from "./sentinel_protocol.json";

const PROGRAM_ID = new PublicKey("5DCbrjFHUdzLHLayUUdFJBnBPC8UV7eUc3wJA1rVRQTa");
const DAO_SEED = Buffer.from("sentinel_dao");

export interface ProtocolStats {
  deployedAgents: number;
  incidentsDetected: number;
  solBonded: number;
  councilMembers: number;
  loading: boolean;
}

function getReadOnlyProgram(connection: Connection) {
  // Create a dummy wallet for read-only operations
  const dummyKeypair = Keypair.generate();
  const dummyWallet = {
    publicKey: dummyKeypair.publicKey,
    signTransaction: () => Promise.reject("Read-only"),
    signAllTransactions: () => Promise.reject("Read-only"),
  } as unknown as Wallet;

  const provider = new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Program(idl as any, provider) as any;
}

export function useProtocolStats(): ProtocolStats {
  const [stats, setStats] = useState<ProtocolStats>({
    deployedAgents: 0,
    incidentsDetected: 0,
    solBonded: 0,
    councilMembers: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
        const program = getReadOnlyProgram(connection);

        // Fetch all agents
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let agents: any[] = [];
        try {
          agents = await program.account.agentRecord.all();
        } catch {
          // Program may not be deployed or no accounts exist
        }

        // Count agents
        const deployedAgents = agents.length;

        // Count total violations across all agents
        let incidentsDetected = 0;
        let solBonded = 0;
        for (const agent of agents) {
          const data = agent.account;
          if (data.violations) {
            incidentsDetected += data.violations.length;
          }
          if (data.stakeAmount) {
            // Convert lamports to SOL
            solBonded += data.stakeAmount.toNumber() / 1e9;
          }
        }

        // Fetch DAO for member count
        let councilMembers = 0;
        try {
          const [daoPda] = PublicKey.findProgramAddressSync([DAO_SEED], PROGRAM_ID);
          const dao = await program.account.sentinelDao.fetch(daoPda);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (dao && (dao as any).members) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            councilMembers = (dao as any).members.filter((m: any) => m.isActive).length;
          }
        } catch {
          // DAO not initialized yet
        }

        if (!cancelled) {
          setStats({
            deployedAgents,
            incidentsDetected,
            solBonded: Math.round(solBonded * 100) / 100,
            councilMembers,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) {
          setStats((prev) => ({ ...prev, loading: false }));
        }
      }
    }

    fetchStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return stats;
}
