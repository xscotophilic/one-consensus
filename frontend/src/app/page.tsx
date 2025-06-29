"use client";

import { useReadContract } from "wagmi";
import { factoryAbi } from "@/lib/abis/factory";
import Loader from "@/components/Loader";
import { config } from "@/lib/config";
import Link from "next/link";

export default function Home() {
  const factoryAddress = config.factoryAddress;

  const { data, isLoading, error } = useReadContract({
    abi: factoryAbi,
    address: factoryAddress,
    functionName: "getDeployedCampaigns",
    query: { enabled: Boolean(factoryAddress) },
  });

  const campaigns = (data as string[]) ?? [];

  return (
    <section className="mt-4 mx-auto max-w-6xl px-6 py-3">
      {renderContent({ factoryAddress, isLoading, error, campaigns })}
    </section>
  );
}

function renderContent({
  factoryAddress,
  isLoading,
  error,
  campaigns,
}: {
  factoryAddress?: string;
  isLoading: boolean;
  error: unknown;
  campaigns: string[];
}) {
  if (!factoryAddress) {
    return <ErrorMessage message="Factory address not configured." />;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return <ErrorMessage message="Failed to load campaigns." />;
  }

  if (campaigns.length === 0) {
    return <p className="text-md">No campaigns yet.</p>;
  }

  return <CampaignList campaigns={campaigns} />;
}

function ErrorMessage({ message }: { message: string }) {
  return <p className="text-md text-red-600">{message}</p>;
}

function CampaignList({ campaigns }: { campaigns: string[] }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {campaigns.map((addr, index) => (
        <li key={addr}>
          <Link
            href={`/campaigns/${addr}`}
            className="block rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md hover:bg-gray-50"
          >
            <h2 className="font-semibold text-lg mb-1">
              Campaign #{index + 1}
            </h2>
            <p className="text-sm text-gray-600 break-all">{addr}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
