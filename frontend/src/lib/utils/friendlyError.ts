/**
 * Converts technical blockchain/wallet errors into user-friendly messages
 * @param error - The error object from wagmi/viem or other sources
 * @returns A user-friendly error message
 */
export function friendlyError(error: any): string {
  const msg = error?.shortMessage || error?.message || "";

  // Insufficient funds
  if (/insufficient funds/i.test(msg)) {
    return "Insufficient funds for transaction";
  }

  // User rejection/cancellation
  if (/denied|rejected|cancel/i.test(msg)) {
    return "Transaction was rejected by the user";
  }

  // Contract execution failures
  if (/execution reverted/i.test(msg)) {
    return "Transaction failed - please check your inputs and try again";
  }

  // Network/connection issues
  if (/network error|connection|timeout/i.test(msg)) {
    return "Network connection error - please try again";
  }

  // Gas estimation failures
  if (/gas/i.test(msg) && /estimate/i.test(msg)) {
    return "Unable to estimate gas - transaction may fail";
  }

  // Nonce issues
  if (/nonce/i.test(msg)) {
    return "Transaction nonce error - please try again";
  }

  // Default fallback for any unhandled errors
  return "Something went wrong";
}
