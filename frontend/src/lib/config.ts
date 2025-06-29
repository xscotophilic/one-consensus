const rawFactory = process.env.NEXT_PUBLIC_FACTORY_ADDRESS;
export const config = {
  factoryAddress: rawFactory
    ? ((rawFactory.startsWith("0x") ? rawFactory : `0x${rawFactory}`) as `0x${string}`)
    : undefined,
} as const;

export function useConfig() {
  return { data: config };
}
