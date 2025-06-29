"use client";

import { useParams, useRouter } from "next/navigation";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  usePublicClient,
} from "wagmi";
import { formatEther } from "ethers";
import { campaignAbi } from "@/lib/abis/campaign";
import { useState, useEffect } from "react";
import { TransactionStatus } from "@/components/TransactionStatus";
import Loader from "@/components/Loader";
import { friendlyError } from "@/lib/utils/friendlyError";

interface Request {
  description: string;
  value: bigint;
  recipient: string;
  complete: boolean;
  approvalCount: bigint;
  hasApproved?: boolean;
}

export default function RequestsPage() {
  const params = useParams();
  const router = useRouter();
  const campaignAddress = params.address as `0x${string}`;

  const { address: userAddress, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [currentPage, setCurrentPage] = useState(1);
  const [requests, setRequests] = useState<Request[]>([]);
  const [isProcessingTx, setIsProcessingTx] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const {
    data: summary,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useReadContract({
    abi: campaignAbi,
    address: campaignAddress,
    functionName: "getSummary",
  });

  const {
    data: isApprover,
    isLoading: isApproverLoading,
    error: approverError,
  } = useReadContract({
    abi: campaignAbi,
    address: campaignAddress,
    functionName: "approvers",
    args: [userAddress as `0x${string}`],
    query: {
      enabled: isConnected && !!userAddress,
    },
  });

  const {
    data: requestCountData,
    isLoading: isRequestCountLoading,
    error: requestCountError,
  } = useReadContract({
    abi: campaignAbi,
    address: campaignAddress,
    functionName: "getRequestsCount",
  });

  const pageSize = 3;
  const requestCount = Number(requestCountData ?? 0);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, requestCount);
  const totalPages = Math.ceil(requestCount / pageSize);

  const {
    data: rawRequestsData,
    isLoading: isRequestsLoading,
    error: requestsError,
  } = useReadContracts({
    contracts: Array.from({ length: endIndex - startIndex }, (_, i) => ({
      abi: campaignAbi,
      address: campaignAddress,
      functionName: "requests",
      args: [BigInt(startIndex + i)],
    })),
  });

  const { data: approvalsData } = useReadContracts({
    contracts: Array.from({ length: endIndex - startIndex }, (_, i) => ({
      abi: campaignAbi,
      address: campaignAddress,
      functionName: "hasApproved",
      args: [BigInt(startIndex + i), userAddress as `0x${string}`],
      allowFailure: true,
    })),
    query: {
      enabled: isConnected && !!userAddress && endIndex > startIndex,
    },
  });

  useEffect(() => {
    if (!rawRequestsData || rawRequestsData.length === 0) return;

    const mapped: Request[] = rawRequestsData.reduce<Request[]>((acc, r, i) => {
      const result = r?.result;
      if (!result || !Array.isArray(result) || result.length < 5) return acc;

      const [description, value, recipient, complete, approvalCount] =
        result as unknown as [string, bigint, string, boolean, bigint];

      const hasApproved = Boolean(approvalsData?.[i]?.result);

      acc.push({
        description,
        value,
        recipient,
        complete,
        approvalCount,
        hasApproved,
      });

      return acc;
    }, []);

    setRequests(mapped);
  }, [rawRequestsData, approvalsData]);

  const isManager =
    userAddress?.toLowerCase() === (summary?.[6] as string)?.toLowerCase();

  const updateSingleRequest = (pageIdx: number, updated: Request) => {
    setRequests((prev) => {
      if (pageIdx < 0 || pageIdx >= prev.length) return prev;
      const next = [...prev];
      next[pageIdx] = updated;
      return next;
    });
  };

  const handleApprove = async (reqIndex: number) => {
    if (!publicClient) return;
    setTxError(null);

    try {
      setIsProcessingTx(true);
      const result = await writeContractAsync({
        abi: campaignAbi,
        address: campaignAddress,
        functionName: "approveRequest",
        args: [BigInt(reqIndex)],
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result,
      });
      if (receipt.status !== "success") throw new Error("Transaction failed");

      await refreshRequest(reqIndex);
      alert("Request approved successfully!");
    } catch (e: any) {
      setTxError(friendlyError(e));
    } finally {
      setIsProcessingTx(false);
    }
  };

  const handleFinalize = async (reqIndex: number) => {
    const campaignBalance = summary?.[3] as bigint | undefined;
    const pageIdx = reqIndex - startIndex;
    const reqToFinalize = requests?.[pageIdx];

    if (
      campaignBalance !== undefined &&
      reqToFinalize &&
      campaignBalance < reqToFinalize.value
    ) {
      setTxError("Campaign balance is insufficient to finalize this request.");
      return;
    }

    if (!publicClient) return;
    setTxError(null);

    try {
      setIsProcessingTx(true);
      const result = await writeContractAsync({
        abi: campaignAbi,
        address: campaignAddress,
        functionName: "finalizeRequest",
        args: [BigInt(reqIndex)],
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result,
      });
      if (receipt.status !== "success") throw new Error("Transaction failed");

      await refreshRequest(reqIndex);
      alert("Request finalized successfully!");
    } catch (e: any) {
      setTxError(friendlyError(e));
    } finally {
      setIsProcessingTx(false);
    }
  };

  const refreshRequest = async (reqIndex: number) => {
    if (!publicClient) return;

    const updatedRaw = await publicClient.readContract({
      abi: campaignAbi,
      address: campaignAddress,
      functionName: "requests",
      args: [BigInt(reqIndex)],
    });

    const updatedHasApproved = await publicClient.readContract({
      abi: campaignAbi,
      address: campaignAddress,
      functionName: "hasApproved",
      args: [BigInt(reqIndex), userAddress as `0x${string}`],
    });

    const updatedReq: Request = {
      description: updatedRaw[0] as string,
      value: updatedRaw[1] as bigint,
      recipient: updatedRaw[2] as string,
      complete: updatedRaw[3] as boolean,
      approvalCount: updatedRaw[4] as bigint,
      hasApproved: updatedHasApproved as boolean,
    };

    const pageIdx = reqIndex - startIndex;
    updateSingleRequest(pageIdx, updatedReq);
  };

  if (summaryError || approverError || requestCountError || requestsError) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-4">
        <StatusMessage
          type="error"
          title="Error loading requests"
          description="Please try refreshing the page or check your network connection."
        />
      </div>
    );
  }

  if (
    isSummaryLoading ||
    isApproverLoading ||
    isRequestCountLoading ||
    isRequestsLoading
  ) {
    return <Loader />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-4">
      <RequestsHeader
        isManager={isManager}
        campaignAddress={campaignAddress}
        router={router}
      />

      {requestCount === 0 && (
        <StatusMessage
          type="empty"
          title="No requests found"
          description={`This campaign doesn't have any spending requests yet.${
            isManager ? " Create the first request to get started." : ""
          }`}
        />
      )}

      {requestCount > 0 && (
        <RequestsTable
          requests={requests}
          startIndex={startIndex}
          isManager={isManager}
          isApprover={isApprover}
          isProcessingTx={isProcessingTx}
          handleFinalize={handleFinalize}
          handleApprove={handleApprove}
        />
      )}

      <TransactionStatus
        isProcessing={isProcessingTx}
        error={txError}
        className="mt-4"
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      )}
    </div>
  );
}

function RequestsHeader({
  isManager,
  campaignAddress,
  router,
}: {
  isManager: boolean;
  campaignAddress: string;
  router: any;
}) {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
      <h1 className="text-xl">Requests</h1>
      <button
        onClick={() =>
          isManager
            ? router.push(`/campaigns/${campaignAddress}/requests/new`)
            : undefined
        }
        disabled={!isManager}
        className={`w-full md:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-xs font-medium shadow-sm transition-colors duration-200 ${
          isManager
            ? "bg-indigo-600 text-white hover:bg-indigo-700"
            : "bg-gray-100 text-gray-300 cursor-not-allowed"
        }`}
      >
        Create Request
      </button>
    </div>
  );
}

function StatusMessage({
  type,
  title,
  description,
}: {
  type: "empty" | "error";
  title: string;
  description: string;
}) {
  const isError = type === "error";

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-12 text-center">
      <div className="mx-auto max-w-sm">
        <svg
          className={`mx-auto h-12 w-12 ${
            isError ? "text-red-400" : "text-gray-400"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {isError ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          )}
        </svg>
        <h3
          className={`mt-4 text-lg font-medium ${
            isError ? "text-red-900" : "text-gray-900"
          }`}
        >
          {title}
        </h3>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

function RequestsTable({
  requests,
  startIndex,
  isManager,
  isApprover,
  isProcessingTx,
  handleFinalize,
  handleApprove,
}: {
  requests: Request[];
  startIndex: number;
  isManager: boolean;
  isApprover: boolean | undefined;
  isProcessingTx: boolean;
  handleFinalize: (reqIndex: number) => Promise<void>;
  handleApprove: (reqIndex: number) => Promise<void>;
}) {
  return (
    <div className="rounded-md border border-gray-200 overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {[
              "Description",
              "Value (ETH)",
              "Recipient",
              "Approvals",
              "Status",
              "Actions",
            ].map((label) => (
              <th
                key={label}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {requests.map((req, index) => (
            <tr key={index}>
              <td className="px-4 py-4 text-sm text-gray-900">
                {req.description}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {Number(formatEther(req.value)).toFixed(4)} ETH
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {req.recipient}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {req.approvalCount.toString()}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900">
                {req.complete ? "Finalized" : "Pending"}
              </td>
              <td className="px-4 py-4 text-right">
                <ActionButton
                  request={req}
                  index={index}
                  startIndex={startIndex}
                  isManager={isManager}
                  isApprover={isApprover}
                  isProcessingTx={isProcessingTx}
                  handleFinalize={handleFinalize}
                  handleApprove={handleApprove}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionButton({
  request,
  index,
  startIndex,
  isManager,
  isApprover,
  isProcessingTx,
  handleFinalize,
  handleApprove,
}: {
  request: Request;
  index: number;
  startIndex: number;
  isManager: boolean;
  isApprover: boolean | undefined;
  isProcessingTx: boolean;
  handleFinalize: (reqIndex: number) => Promise<void>;
  handleApprove: (reqIndex: number) => Promise<void>;
}) {
  const globalIndex = startIndex + index;

  if (isManager && !request.complete) {
    return (
      <button
        onClick={() => handleFinalize(globalIndex)}
        disabled={isProcessingTx}
        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
      >
        Finalize
      </button>
    );
  }

  if (
    isApprover &&
    !request.complete &&
    (request.hasApproved === false)
  ) {
    return (
      <button
        onClick={() => handleApprove(globalIndex)}
        disabled={isProcessingTx}
        className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
      >
        Approve
      </button>
    );
  }

  return null;
}

function Pagination({
  currentPage,
  totalPages,
  setCurrentPage,
}: {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
}) {
  const pageNumbers: (number | string)[] = [];

  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);

    if (currentPage > 3) {
      pageNumbers.push("...");
    }

    const middlePages = [currentPage - 1, currentPage, currentPage + 1].filter(
      (page) => page > 1 && page < totalPages
    );

    pageNumbers.push(...middlePages);

    if (currentPage < totalPages - 2) {
      pageNumbers.push("...");
    }

    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex justify-center mt-6">
      <nav className="inline-flex items-center gap-1">
        {pageNumbers.map((page, i) =>
          typeof page === "number" ? (
            <button
              key={i}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                page === currentPage
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {page}
            </button>
          ) : (
            <span key={i} className="px-2 text-gray-500">
              ...
            </span>
          )
        )}
      </nav>
    </div>
  );
}
