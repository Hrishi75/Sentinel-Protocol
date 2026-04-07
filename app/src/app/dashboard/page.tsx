"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AgentCard } from "@/components/AgentCard";
import { useProgram } from "@/lib/useProgram";
import { fetchAllAgents, getStatusString } from "@/lib/program";
import { AuthGuard } from "@/components/AuthGuard";
import { HUDFrame } from "@/components/HUDFrame";
import { OperativeCard } from "@/components/OperativeCard";
import { RadarScan } from "@/components/RadarScan";
import Link from "next/link";

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

function DashboardContent() {
  const { program } = useProgram();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAgents = useCallback(async () => {
    if (!program) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");
      const accounts = await fetchAllAgents(program);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setAgents(accounts.map((a: any) => a.account));
    } catch (err) {
      console.error("Failed to fetch agents:", err);
      setError("Failed to load assets. Ensure DAO is initialized on devnet.");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const stats = {
    total: agents.length,
    active: agents.filter((a) => getStatusString(a.status) === "Active").length,
    arrested: agents.filter((a) => getStatusString(a.status) === "Arrested").length,
    paroled: agents.filter((a) => getStatusString(a.status) === "Paroled").length,
  };

  const statCards = [
    { label: "DEPLOYED ASSETS", value: stats.total, color: "#00E5CC", hudColor: "cyan" as const },
    { label: "OPERATIONAL", value: stats.active, color: "#39FF14", hudColor: "green" as const },
    { label: "CONTAINED", value: stats.arrested, color: "#FF0033", hudColor: "red" as const },
    { label: "RESTRICTED", value: stats.paroled, color: "#FF9B26", hudColor: "orange" as const },
  ];

  const radarBlips = agents.slice(0, 8).map((a, i) => {
    const status = getStatusString(a.status);
    const angle = (i / Math.max(agents.length, 1)) * 360;
    const dist = 30 + Math.random() * 50;
    return {
      x: Math.cos((angle * Math.PI) / 180) * dist,
      y: Math.sin((angle * Math.PI) / 180) * dist,
      color: status === "Active" ? "#39FF14" : status === "Arrested" ? "#FF0033" : "#FF9B26",
    };
  });

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger}>
      {/* Header */}
      <motion.div className="flex items-start justify-between mb-8 gap-4" variants={fadeUp}>
        <div>
          <div className="font-mono text-xs text-warden-cyan/50 tracking-[0.3em] mb-2">
            SENTINEL PROTOCOL
          </div>
          <h1 className="text-3xl font-bold font-mono text-white tracking-tight">
            COMMAND CENTER
          </h1>
          <p className="text-gray-600 font-mono text-sm mt-1 tracking-wide">
            Monitor and manage all deployed AI operatives
          </p>
        </div>
        <div className="flex items-center gap-3">
          {program && (
            <motion.button
              onClick={loadAgents}
              className="btn-hud !py-2 !px-4 text-xs"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              REFRESH
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Operative Profile + Radar */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8" variants={fadeUp}>
        <div className="lg:col-span-3">
          <OperativeCard />
        </div>
        <div className="hidden lg:flex items-center justify-center">
          <RadarScan size={140} blips={radarBlips} />
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        variants={stagger}
      >
        {statCards.map((stat) => (
          <motion.div key={stat.label} variants={fadeUp}>
            <HUDFrame
              color={stat.hudColor}
              className="!p-4"
              label={stat.label}
            >
              <p
                className="text-3xl font-bold font-mono mt-2"
                style={{ color: stat.color }}
              >
                {stat.value}
              </p>
            </HUDFrame>
          </motion.div>
        ))}
      </motion.div>

      <div className="hud-divider mb-8" />

      {/* Agent Grid */}
      {loading ? (
        <motion.div className="text-center py-20" variants={fadeUp}>
          <div className="w-8 h-8 border-2 border-warden-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-mono text-sm tracking-wider">
            SCANNING DEVNET FOR ASSETS...
          </p>
        </motion.div>
      ) : error ? (
        <motion.div variants={fadeUp}>
          <HUDFrame color="red" className="text-center py-12">
            <p className="text-alert-red font-mono text-sm mb-2">{error}</p>
            <p className="text-gray-600 text-xs font-mono">
              Connect wallet and verify program deployment.
            </p>
          </HUDFrame>
        </motion.div>
      ) : agents.length === 0 ? (
        <motion.div variants={fadeUp}>
          <HUDFrame color="cyan" className="text-center py-16">
            <div className="text-4xl mb-4 opacity-20">⬡</div>
            <p className="text-gray-400 font-mono text-sm mb-2 tracking-wider">
              NO ASSETS DEPLOYED
            </p>
            <p className="text-gray-600 text-xs font-mono mb-6">
              {program
                ? "Initiate first operative deployment."
                : "Connect wallet to access deployment systems."}
            </p>
            <Link href="/register" className="btn-hud">
              DEPLOY FIRST OPERATIVE
            </Link>
          </HUDFrame>
        </motion.div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          variants={stagger}
        >
          {agents.map((agent, i) => (
            <motion.div key={i} variants={fadeUp}>
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function Dashboard() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
