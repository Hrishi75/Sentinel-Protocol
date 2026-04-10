import type { OperativeProfile, LinkedWallet } from "./auth";

const API_BASE = "/api/profiles";

export async function fetchProfile(walletAddress: string): Promise<OperativeProfile | null> {
  try {
    const res = await fetch(`${API_BASE}?wallet=${encodeURIComponent(walletAddress)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveProfileToServer(profile: OperativeProfile): Promise<OperativeProfile | null> {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteProfileFromServer(walletAddress: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}?wallet=${encodeURIComponent(walletAddress)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function linkWalletOnServer(
  walletAddress: string,
  newAddress: string,
  label?: string
): Promise<LinkedWallet | null> {
  try {
    const res = await fetch(`${API_BASE}/link-wallet`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, newAddress, label }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function unlinkWalletOnServer(address: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/link-wallet?address=${encodeURIComponent(address)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}
