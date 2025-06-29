"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAccount, useWriteContract, usePublicClient } from "wagmi";
import { parseEther } from "viem";
import { config } from "@/lib/config";
import { factoryAbi } from "@/lib/abis/factory";
import { TransactionStatus } from "@/components/TransactionStatus";
import { friendlyError } from "@/lib/utils/friendlyError";

function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

function validateInputs(
  title: string,
  description: string,
  minContribution: string
): string | null {
  if (!title.trim()) return "Title is required";
  if (title.length > 100) return "Title is too long (max 100 characters)";
  if (!description.trim()) return "Description is required";
  if (description.length > 1000)
    return "Description is too long (max 1000 characters)";
  if (!minContribution) return "Minimum contribution is required";
  if (isNaN(Number(minContribution)) || Number(minContribution) <= 0)
    return "Minimum contribution must be a positive number";
  return null;
}

export default function CreateCampaignPage() {
  const router = useRouter();
  const factoryAddress = config.factoryAddress;
  const publicClient = usePublicClient();
  const { isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [minContribution, setMinContribution] = useState("");
  const [txError, setTxError] = useState<string | null>(null);
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const isMounted = useMounted();

  useEffect(() => {
    if (!factoryAddress) router.push("/404");
  }, [factoryAddress, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicClient || !factoryAddress) return;
    setTxError(null);

    const error = validateInputs(title, description, minContribution);
    if (error) {
      setTxError(error);
      return;
    }

    try {
      setIsProcessingTx(true);

      const minWei = parseEther(minContribution);
      const result = await writeContractAsync({
        abi: factoryAbi,
        address: factoryAddress,
        functionName: "createCampaign",
        args: [title, description, minWei],
      });

      await publicClient.waitForTransactionReceipt({ hash: result });
      router.push("/");
    } catch (e: any) {
      setTxError(friendlyError(e));
    } finally {
      setIsProcessingTx(false);
    }
  };

  if (!factoryAddress) return <FactoryError />;

  return (
    <div className="mx-auto max-w-6xl px-6 py-4">
      <h1 className="text-xl mb-4">Create New Campaign</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <CampaignForm
          title={title}
          description={description}
          minContribution={minContribution}
          setTitle={setTitle}
          setDescription={setDescription}
          setMinContribution={setMinContribution}
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

function FactoryError() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-4">
      <div className="bg-red-50 text-red-600 p-4 rounded-md">
        Factory address not configured.
      </div>
    </div>
  );
}

function CampaignForm({
  title,
  description,
  minContribution,
  setTitle,
  setDescription,
  setMinContribution,
  isMounted,
  isConnected,
  isProcessingTx,
  txError,
  handleSubmit,
}: {
  title: string;
  description: string;
  minContribution: string;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setMinContribution: (value: string) => void;
  isMounted: boolean;
  isConnected: boolean;
  isProcessingTx: boolean;
  txError: string | null;
  handleSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <TextInputField
        label="Title"
        value={title}
        placeholder="Campaign title"
        required
        maxLength={100}
        showCharCount={true}
        onChange={(e) => setTitle(e.target.value)}
      />

      <TextAreaField
        label="Description"
        value={description}
        placeholder="Campaign description"
        required
        maxLength={1000}
        showCharCount={true}
        onChange={(e) => setDescription(e.target.value)}
      />

      <NumberInputField
        label="Minimum Contribution (ETH)"
        value={minContribution}
        placeholder="0.001"
        step="0.001"
        min="0"
        required
        onChange={(e) => setMinContribution(e.target.value)}
      />

      <TransactionStatus isProcessing={isProcessingTx} error={txError} />

      <SubmitButton
        isMounted={isMounted}
        isConnected={isConnected}
        isProcessingTx={isProcessingTx}
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
  maxLength,
  showCharCount,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
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
}: {
  isMounted: boolean;
  isConnected: boolean;
  isProcessingTx: boolean;
}) {
  const label = !isMounted
    ? "Loading..."
    : !isConnected
    ? "Please connect your wallet first!"
    : isProcessingTx
    ? "Creating campaign..."
    : "Create campaign";

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
      {label}
    </button>
  );
}
