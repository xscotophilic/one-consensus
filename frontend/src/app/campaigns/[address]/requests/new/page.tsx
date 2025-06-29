"use client";

import { notFound, useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  useAccount,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi";
import { parseEther } from "viem";
import { config } from "@/lib/config";
import { campaignAbi } from "@/lib/abis/campaign";
import { TransactionStatus } from "@/components/TransactionStatus";
import Loader from "@/components/Loader";
import { friendlyError } from "@/lib/utils/friendlyError";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function validateInputs(
  description: string,
  amount: string,
  recipient: string
): string | null {
  if (!description.trim()) return "Description is required";
  if (description.length > 1000)
    return "Description is too long (max 1000 characters)";
  if (!amount.trim()) return "Contribution amount is required";
  if (isNaN(Number(amount)) || Number(amount) <= 0)
    return "Amount must be a positive number";
  if (!recipient.trim()) return "Recipient address is required";
  return null;
}

export default function CreateRequestPage() {
  const params = useParams<{ address: string }>();
  const address = params?.address as `0x${string}` | undefined;
  const factoryAddress = config.factoryAddress;
  const router = useRouter();

  const { isConnected, address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const isMounted = useMounted();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [txError, setTxError] = useState<string | null>(null);
  const [isProcessingTx, setIsProcessingTx] = useState(false);

  const {
    data: summary,
    isLoading,
    error,
  } = useReadContract({
    abi: campaignAbi,
    address,
    functionName: "getSummary",
  });

  if (!factoryAddress) notFound();
  if (isLoading) return <Loader />;
  if (error)
    return (
      <div className="mx-auto max-w-6xl px-2">
        <p className="p-4 text-red-600">Failed to load campaign.</p>
      </div>
    );
  if (!summary) return <Loader />;

  const manager = summary[6];
  if (userAddress?.toLowerCase() !== manager.toLowerCase()) {
    return (
      <div className="mx-auto max-w-6xl px-2">
        <p className="p-4 text-red-600">
          You do not have permission to access this resource.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicClient || !factoryAddress || !address) return;
    setTxError(null);

    const error = validateInputs(description, amount, recipient);
    if (error) {
      setTxError(error);
      return;
    }

    try {
      setIsProcessingTx(true);
      const wei = parseEther(amount);
      const recipientAddress = (
        recipient.startsWith("0x") ? recipient : `0x${recipient}`
      ) as `0x${string}`;

      const result = await writeContractAsync({
        abi: campaignAbi,
        address,
        functionName: "createRequest",
        args: [description, wei, recipientAddress],
      });

      await publicClient.waitForTransactionReceipt({ hash: result });

      setDescription("");
      setAmount("");
      setRecipient("");

      router.push(`/campaigns/${address}/requests`);
    } catch (e: any) {
      setTxError(friendlyError(e));
    } finally {
      setIsProcessingTx(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <h1 className="text-xl mb-4">Create New Request</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <CampaignForm
          description={description}
          amount={amount}
          recipient={recipient}
          setDescription={setDescription}
          setAmount={setAmount}
          setRecipient={setRecipient}
          isMounted={isMounted}
          isConnected={isConnected}
          isProcessingTx={isProcessingTx}
          txError={txError}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

function CampaignForm({
  description,
  amount,
  recipient,
  setDescription,
  setAmount,
  setRecipient,
  isMounted,
  isConnected,
  isProcessingTx,
  txError,
  handleSubmit,
}: {
  description: string;
  amount: string;
  recipient: string;
  setDescription: (value: string) => void;
  setAmount: (value: string) => void;
  setRecipient: (value: string) => void;
  isMounted: boolean;
  isConnected: boolean;
  isProcessingTx: boolean;
  txError: string | null;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <TextAreaField
        label="Description"
        value={description}
        placeholder="Describe the request"
        required
        maxLength={1000}
        showCharCount
        onChange={(e) => setDescription(e.target.value)}
      />

      <NumberInputField
        label="Amount to Pay (ETH)"
        value={amount}
        placeholder="0.001"
        step="0.001"
        min="0"
        required
        onChange={(e) => setAmount(e.target.value)}
      />

      <TextInputField
        label="Recipient Address"
        value={recipient}
        placeholder="0x..."
        required
        onChange={(e) => setRecipient(e.target.value)}
      />

      <TransactionStatus isProcessing={isProcessingTx} error={txError} />

      <SubmitButton
        isMounted={isMounted}
        isConnected={isConnected}
        isProcessingTx={isProcessingTx}
        label="Create Request"
      />
    </form>
  );
}

function TextInputField({
  label,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function NumberInputField({
  label,
  value,
  onChange,
  placeholder,
  required,
  step,
  min,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  step?: string;
  min?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        step={step}
        min={min}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  required,
  maxLength,
  showCharCount,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {showCharCount && maxLength && (
          <span className="text-sm text-gray-500">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        rows={4}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function SubmitButton({
  isMounted,
  isConnected,
  isProcessingTx,
  label,
}: {
  isMounted: boolean;
  isConnected: boolean;
  isProcessingTx: boolean;
  label: string;
}) {
  const buttonText = !isMounted
    ? "Loading..."
    : !isConnected
    ? "Please connect your wallet first!"
    : isProcessingTx
    ? `${label}...`
    : label;

  const disabled = !isMounted || !isConnected || isProcessingTx;

  return (
    <button
      type="submit"
      disabled={disabled}
      className={`w-full py-2 px-4 rounded-md font-medium ${
        disabled
          ? "bg-gray-300 cursor-not-allowed"
          : "bg-indigo-600 hover:bg-indigo-700 text-white"
      }`}
    >
      {buttonText}
    </button>
  );
}
