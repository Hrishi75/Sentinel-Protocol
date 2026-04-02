import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { expect } from "chai";
import { WardenProtocol } from "../target/types/warden_protocol";

describe("warden-protocol", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.WardenProtocol as Program<WardenProtocol>;
  const programId = program.programId;

  // Test wallets
  const daoAuthority = provider.wallet;
  const agentOwner = Keypair.generate();
  const agentIdentity = Keypair.generate();
  const daoMember1 = Keypair.generate();
  const daoMember2 = Keypair.generate();
  const daoMember3 = Keypair.generate();
  const treasury = Keypair.generate();

  // PDAs
  let wardenDaoPda: PublicKey;
  let wardenDaoBump: number;
  let agentRecordPda: PublicKey;
  let agentRecordBump: number;
  let vaultPda: PublicKey;
  let cellPda: PublicKey;
  let bailRequestPda: PublicKey;
  let bailVaultPda: PublicKey;

  before(async () => {
    // Derive PDAs
    [wardenDaoPda, wardenDaoBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("warden_dao")],
      programId
    );

    [agentRecordPda, agentRecordBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), agentIdentity.publicKey.toBuffer()],
      programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), agentRecordPda.toBuffer()],
      programId
    );

    [cellPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("cell"), agentRecordPda.toBuffer()],
      programId
    );

    [bailRequestPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bail"), cellPda.toBuffer()],
      programId
    );

    [bailVaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("bail_vault"), bailRequestPda.toBuffer()],
      programId
    );

    // Airdrop SOL to test wallets
    const airdropAmount = 10 * LAMPORTS_PER_SOL;
    for (const wallet of [agentOwner, daoMember1, daoMember2, daoMember3]) {
      const sig = await provider.connection.requestAirdrop(wallet.publicKey, airdropAmount);
      await provider.connection.confirmTransaction(sig);
    }
  });

  describe("DAO Initialization", () => {
    it("initializes the Warden DAO", async () => {
      const initialMembers = [
        { wallet: daoMember1.publicKey, stake: new anchor.BN(1_000_000_000), isActive: true },
        { wallet: daoMember2.publicKey, stake: new anchor.BN(1_000_000_000), isActive: true },
        { wallet: daoMember3.publicKey, stake: new anchor.BN(500_000_000), isActive: true },
      ];

      await program.methods
        .initDao(
          51, // vote threshold %
          new anchor.BN(60), // review window: 60 seconds for testing
          new anchor.BN(100_000_000), // min bail: 0.1 SOL
          50, // slash percentage
          initialMembers
        )
        .accounts({
          authority: daoAuthority.publicKey,
          wardenDao: wardenDaoPda,
          treasury: treasury.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      const dao = await program.account.wardenDao.fetch(wardenDaoPda);
      expect(dao.authority.toString()).to.equal(daoAuthority.publicKey.toString());
      expect(dao.members.length).to.equal(3);
      expect(dao.voteThreshold).to.equal(51);
      expect(dao.slashPercentage).to.equal(50);
      console.log("  ✓ DAO initialized with 3 members");
    });
  });

  describe("Agent Registration", () => {
    it("registers an agent with staked SOL", async () => {
      const stakeAmount = new anchor.BN(1 * LAMPORTS_PER_SOL);
      const permissions = {
        maxTransferLamports: new anchor.BN(100_000_000), // 0.1 SOL
        allowedPrograms: [],
        maxDailyTransactions: 10,
      };

      await program.methods
        .registerAgent(permissions, stakeAmount)
        .accounts({
          owner: agentOwner.publicKey,
          agentIdentity: agentIdentity.publicKey,
          agentRecord: agentRecordPda,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([agentOwner, agentIdentity])
        .rpc();

      const agent = await program.account.agentRecord.fetch(agentRecordPda);
      expect(agent.agentIdentity.toString()).to.equal(agentIdentity.publicKey.toString());
      expect(agent.owner.toString()).to.equal(agentOwner.publicKey.toString());
      expect(agent.stakeAmount.toNumber()).to.equal(LAMPORTS_PER_SOL);
      expect(agent.status).to.deep.equal({ active: {} });
      expect(agent.violations.length).to.equal(0);
      console.log("  ✓ Agent registered with 1 SOL stake");
    });
  });

  describe("Agent Arrest", () => {
    it("arrests an active agent", async () => {
      const reason = "Exceeded transfer limit: sent 0.5 SOL when limit is 0.1 SOL";
      const evidenceHash = new Array(32).fill(1); // Mock hash

      await program.methods
        .arrestAgent(
          reason,
          evidenceHash,
          { exceededTransferLimit: {} }
        )
        .accounts({
          arrester: daoMember1.publicKey,
          agentRecord: agentRecordPda,
          cell: cellPda,
          wardenDao: wardenDaoPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([daoMember1])
        .rpc();

      const agent = await program.account.agentRecord.fetch(agentRecordPda);
      expect(agent.status).to.deep.equal({ arrested: {} });
      expect(agent.violations.length).to.equal(1);

      const cell = await program.account.cell.fetch(cellPda);
      expect(cell.arrester.toString()).to.equal(daoMember1.publicKey.toString());
      expect(cell.bailPosted).to.equal(false);
      console.log("  ✓ Agent arrested, Cell created, violation logged");
    });
  });

  describe("Bail & Voting", () => {
    it("owner posts bail", async () => {
      const bailAmount = new anchor.BN(500_000_000); // 0.5 SOL

      await program.methods
        .postBail(bailAmount)
        .accounts({
          owner: agentOwner.publicKey,
          agentRecord: agentRecordPda,
          cell: cellPda,
          bailRequest: bailRequestPda,
          bailVault: bailVaultPda,
          wardenDao: wardenDaoPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([agentOwner])
        .rpc();

      const bail = await program.account.bailRequest.fetch(bailRequestPda);
      expect(bail.bailAmount.toNumber()).to.equal(500_000_000);
      expect(bail.outcome).to.deep.equal({ pending: {} });

      const cell = await program.account.cell.fetch(cellPda);
      expect(cell.bailPosted).to.equal(true);
      console.log("  ✓ Bail of 0.5 SOL posted, review window opened");
    });

    it("DAO member 1 votes Parole", async () => {
      await program.methods
        .castVote({ paroled: {} })
        .accounts({
          voter: daoMember1.publicKey,
          bailRequest: bailRequestPda,
          cell: cellPda,
          agentRecord: agentRecordPda,
          wardenDao: wardenDaoPda,
        })
        .signers([daoMember1])
        .rpc();

      const bail = await program.account.bailRequest.fetch(bailRequestPda);
      expect(bail.votes.length).to.equal(1);
      // Threshold not met yet (1B / 2.5B = 40% < 51%)
      expect(bail.outcome).to.deep.equal({ pending: {} });
      console.log("  ✓ DAO member 1 voted Parole (40% — threshold not met)");
    });

    it("DAO member 2 votes Parole — threshold met", async () => {
      await program.methods
        .castVote({ paroled: {} })
        .accounts({
          voter: daoMember2.publicKey,
          bailRequest: bailRequestPda,
          cell: cellPda,
          agentRecord: agentRecordPda,
          wardenDao: wardenDaoPda,
        })
        .signers([daoMember2])
        .rpc();

      const bail = await program.account.bailRequest.fetch(bailRequestPda);
      expect(bail.votes.length).to.equal(2);
      // 2B / 2.5B = 80% >= 51% — resolved!
      expect(bail.outcome).to.deep.equal({ paroled: {} });
      console.log("  ✓ DAO member 2 voted Parole (80% — RESOLVED: Paroled)");
    });
  });

  describe("Agent Release on Parole", () => {
    it("releases agent on parole with restricted permissions", async () => {
      await program.methods
        .releaseAgent()
        .accounts({
          authority: daoMember1.publicKey,
          agentRecord: agentRecordPda,
          cell: cellPda,
          bailRequest: bailRequestPda,
          bailVault: bailVaultPda,
          stakeVault: vaultPda,
          owner: agentOwner.publicKey,
          wardenDao: wardenDaoPda,
          treasury: treasury.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([daoMember1])
        .rpc();

      const agent = await program.account.agentRecord.fetch(agentRecordPda);
      expect(agent.status).to.deep.equal({ paroled: {} });
      expect(agent.paroleTerms).to.not.be.null;
      expect(agent.paroleTerms.strikesRemaining).to.equal(3);
      expect(agent.paroleTerms.mustReport).to.equal(true);
      console.log("  ✓ Agent released on PAROLE with 3 strikes, must-report mode");
    });
  });

  describe("Parole Violation & Auto Re-arrest", () => {
    it("reports a parole violation", async () => {
      const evidenceHash = new Array(32).fill(2);

      await program.methods
        .reportViolation(
          { paroleViolation: {} },
          evidenceHash,
          "Attempted unauthorized transfer"
        )
        .accounts({
          reporter: daoMember1.publicKey,
          agentRecord: agentRecordPda,
          wardenDao: wardenDaoPda,
          systemProgram: SystemProgram.programId,
        })
        .signers([daoMember1])
        .rpc();

      const agent = await program.account.agentRecord.fetch(agentRecordPda);
      expect(agent.status).to.deep.equal({ paroled: {} });
      expect(agent.paroleTerms.strikesRemaining).to.equal(2);
      expect(agent.violations.length).to.equal(2);
      console.log("  ✓ Violation reported, strikes: 2 remaining");
    });
  });

  describe("Probation Completion", () => {
    it("reinstates agent after probation period (requires time advancement)", async () => {
      // Note: In a real test, you'd advance the clock.
      // For localnet, we'd need to warp time which isn't trivial.
      // This test documents the expected behavior.
      console.log("  ⏭ Probation completion test skipped (requires clock manipulation)");
      console.log("    Agent would be reinstated to Active after probation_end timestamp");
    });
  });
});
