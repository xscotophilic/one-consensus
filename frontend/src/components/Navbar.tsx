"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useChainId } from "wagmi";
import { metaMask } from "wagmi/connectors";

function truncateAddress(addr: string) {
  return addr.slice(0, 6) + "…" + addr.slice(-4);
}

export default function Navbar() {
  const [hydrated, setHydrated] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setHydrated(true), []);
  const targetChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 1);

  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  const wrongNetwork = chainId !== undefined && chainId !== targetChainId;

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <header className="sticky top-0 z-10 w-full border-b border-gray-200 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-semibold">
          One-Consensus
        </Link>

        <div className="hidden sm:flex items-center gap-2">
          {chainId && (
            <span className="rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-600">
              {wrongNetwork ? "Wrong network" : `Chain ${chainId}`}
            </span>
          )}

          {hydrated && isConnected && (
            <button
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              onClick={() => router.push("/campaigns/new")}
            >
              Create Campaign
            </button>
          )}

          {hydrated && isConnected ? (
            <button
              onClick={() => disconnect()}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              {truncateAddress(address ?? "")}
            </button>
          ) : (
            <button
              onClick={() => connect({ connector: metaMask() })}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
            >
              Connect Wallet
            </button>
          )}
        </div>

        <button
          className="sm:hidden text-2xl font-semibold"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          {menuOpen ? "×" : "≡"}
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden px-4 pb-4">
          <div className="flex flex-col gap-2">
            {chainId && (
              <div className="w-full flex justify-center">
                <span className="w-full rounded-md bg-gray-200 px-3 py-1.5 text-sm text-gray-600 text-center">
                  {wrongNetwork ? "Wrong network" : `Chain ${chainId}`}
                </span>
              </div>
            )}

            {hydrated && isConnected && (
              <button
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
                onClick={() => {
                  setMenuOpen(false);
                  router.push("/campaigns/new");
                }}
              >
                Create Campaign
              </button>
            )}

            {hydrated && isConnected ? (
              <button
                onClick={() => {
                  disconnect();
                }}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                {truncateAddress(address ?? "")}
              </button>
            ) : (
              <button
                onClick={() => {
                  connect({ connector: metaMask() });
                }}
                className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm text-white hover:bg-indigo-700"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
