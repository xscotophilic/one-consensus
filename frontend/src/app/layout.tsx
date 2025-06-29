import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navbar from "@/components/Navbar";
import Providers from "./providers";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "One-Consensus",
  description: "One-Consensus - A decentralized crowdfunding platform built on Ethereum",
  keywords: ["crowdfunding", "ethereum", "blockchain", "dapp", "web3"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gray-50 text-gray-900 antialiased`}>
        <Providers>
          <Navbar />
          {children}
        </Providers>
      </body>
    </html>
  );
}
