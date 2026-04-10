"use client";

import { useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { getProvider, getProgram } from "./program";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = getProvider(connection, wallet);
    return getProgram(provider);
  }, [connection, wallet]);

  return { program, connection, wallet };
}
