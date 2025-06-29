"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { formatEther, parseEther } from "viem";
import { campaignAbi } from "@/lib/abis/campaign";
import { TransactionStatus } from "@/components/TransactionStatus";
import Loader from "@/components/Loader";
import { friendlyError } from "@/lib/utils/friendlyError";

type CampaignSummary = readonly [
  string, // title
  string, // description
  bigint, // minContribution
  bigint, // balance
  bigint, // requests
  bigint, // approvers
  `0x${string}` // manager
];

const validateAmount = (amount: string, min: bigint): string | null => {
  if (!amount) return "Please enter an amount.";
  const wei = parseEther(amount);
  if (wei < min) return `Amount must be at least ${formatEther(min)} ETH`;
  return null;
};

const sendContribution = async (
  writeAsync: any,
  address: `0x${string}`,
  amount: string
) => {
  return await writeAsync({
    abi: campaignAbi,
    address,
    functionName: "contribute",
    value: parseEther(amount || "0"),
  });
};

export default function CampaignDetailPage() {
  const { address } = useParams<{ address: string }>() || {};
  const router = useRouter();
  const { isConnected, address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [amount, setAmount] = useState("");
  const [txError, setTxError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    data: rawSummary,
    isLoading,
    error,
    refetch,
  } = useReadContract({
    abi: campaignAbi,
    address: address as `0x${string}`,
    functionName: "getSummary",
  });

  useEffect(() => {
    setTxError(null);
  }, [amount]);

  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) return notFound();

  const summary = rawSummary as CampaignSummary | undefined;
  if (isLoading) return <Loader />;
  if (error || !summary)
    return <StatusMessage text="Failed to load campaign." isError />;

  const [
    title,
    description,
    minContribution,
    balance,
    requests,
    approvers,
    manager,
  ] = summary;

  const minContributionEth = formatEther(minContribution);
  const balanceEth = formatEther(balance);
  const isManager =
    isConnected && userAddress?.toLowerCase() === manager.toLowerCase();

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    setTxError(null);

    const error = validateAmount(amount, minContribution);
    if (error) return setTxError(error);

    try {
      setIsProcessing(true);
      const tx = await sendContribution(
        writeContractAsync,
        address as `0x${string}`,
        amount
      );
      await publicClient?.waitForTransactionReceipt({ hash: tx });
      setAmount("");
      await refetch();
    } catch (err) {
      setTxError(friendlyError(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 md:gap-4">
        <main className="col-span-2 space-y-6 mb-4">
          <CampaignInfo title={title} description={description} />

          <div className="bg-white shadow rounded p-4 space-y-2">
            <ContributeForm
              isConnected={isConnected}
              amount={amount}
              setAmount={setAmount}
              handleContribute={handleContribute}
              isProcessing={isProcessing}
              minContributionEth={minContributionEth}
              txError={txError}
            />
            <RouteButton
              label="Check Requests"
              path={`/campaigns/${address}/requests`}
              isProcessing={isProcessing}
              router={router}
            />
            {isManager && (
              <RouteButton
                label="Create Request"
                path={`/campaigns/${address}/requests/new`}
                isProcessing={isProcessing}
                router={router}
              />
            )}
          </div>
        </main>

        <aside className="md:space-y-6 space-y-4">
          <div className="bg-gray-100 p-4 rounded">
            <ManagerInfo isManager={isManager} manager={manager} />
          </div>
          <div className="bg-gray-100 p-4 rounded grid grid-cols-2 gap-4">
            <Stat label="Min Contribution" value={minContributionEth} />
            <Stat label="Balance" value={balanceEth} />
            <Stat label="Requests" value={requests.toString()} />
            <Stat label="Approvers" value={approvers.toString()} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusMessage({
  text,
  isError = false,
}: {
  text: string;
  isError?: boolean;
}) {
  return (
    <div className="mx-auto max-w-6xl px-2">
      <p className={`p-4 ${isError ? "text-red-600" : "text-gray-600"}`}>
        {text}
      </p>
    </div>
  );
}

function CampaignInfo({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-xs text-gray-500">Title</h3>
        <p className="text-xl text-gray-800 break-all">{title}</p>
      </div>
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="text-xs text-gray-500">Description</h3>
        <p className="text-xl text-gray-800 break-all">{description}</p>
      </div>
    </div>
  );
}

function ContributeForm({
  isConnected,
  amount,
  setAmount,
  handleContribute,
  isProcessing,
  minContributionEth,
  txError,
}: {
  isConnected: boolean;
  amount: string;
  setAmount: (amount: string) => void;
  handleContribute: (e: React.FormEvent) => void;
  isProcessing: boolean;
  minContributionEth: string;
  txError: string | null;
}) {
  return (
    <div className="flex flex-col gap-3">
      {isConnected ? (
        <form onSubmit={handleContribute} className="flex space-x-2 w-full">
          <input
            type="number"
            min={Number(minContributionEth)}
            placeholder="Amount in ETH"
            className="w-full rounded bg-gray-200 px-3 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <button
            type="submit"
            className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-indigo-700 transition"
            disabled={isProcessing || !amount}
          >
            {isProcessing ? "Submitting…" : "Contribute"}
          </button>
        </form>
      ) : (
        <p className="text-sm text-gray-600">
          Connect your wallet to contribute.
        </p>
      )}
      <TransactionStatus isProcessing={isProcessing} error={txError} />
    </div>
  );
}

function RouteButton({
  label,
  path,
  isProcessing,
  router,
}: {
  label: string;
  path: string;
  isProcessing: boolean;
  router: any;
}) {
  return (
    <button
      className="w-full rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50 hover:bg-indigo-700 transition"
      onClick={() => router.push(path)}
      disabled={isProcessing}
    >
      {label}
    </button>
  );
}

function ManagerInfo({
  isManager,
  manager,
}: {
  isManager: boolean;
  manager: string;
}) {
  return (
    <p className="text-sm break-all">
      {isManager
        ? "As the official campaign manager, your powers shape every move! Use them wisely!"
        : `Manager Address: ${manager}`}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      <span className="text-lg font-semibold text-gray-800">{value}</span>
    </div>
  );
}
