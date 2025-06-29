# One Consensus: Frontend DApp

This directory contains the web application that interacts with the One Consensus smart-contracts.

The UI lets anyone:

- Create new crowdfunding campaigns
- Contribute ETH to existing campaigns
- Propose, vote and finalise spending requests

## Prerequisites

- Ensure you have [Node.js](https://nodejs.org/) (which includes `npm`) installed on your system.
- A modern web-browser with MetaMask (or any EIP-1193 wallet)

### Step 1: Install dependencies

First, navigate to the `frontend` directory and install the required Node.js packages by running:

```bash
npm install
```

### Step 2: Configure Environment Variables

The project requires a `.env` file to store network-specific values.

1.  Make a copy of the example file:
    ```bash
    cp .env.example .env
    ```
2.  Open the newly created `.env` file and fill in **all** of the variables shown below:
    ```
    NEXT_PUBLIC_FACTORY_ADDRESS="0xYourFactoryAddress"
    NEXT_PUBLIC_RPC_URL="https://holesky.gateway.tenderly.co/<your_access_token>"
    NEXT_PUBLIC_CHAIN_ID="17000"
    ```
    - **`NEXT_PUBLIC_FACTORY_ADDRESS`** – Address of the deployed `CampaignFactory` contract.
    - **`NEXT_PUBLIC_RPC_URL`** – JSON-RPC endpoint for the same network where you deployed your contract (see the [contracts README](../contracts/README.md#step-2-configure-environment-variables) for endpoint options).
    - **`NEXT_PUBLIC_CHAIN_ID`** – Numeric chain ID that corresponds to the RPC URL (e.g., `17000` for Holesky, `11155111` for Sepolia).

> **Security:** The `.env` file is excluded by `.gitignore` and should **never** be committed to version control.

> All three variables **must** point to the same network that your smart-contracts were deployed to in the `contracts/` project.

### Step 3: Run the development server

```bash
npm run dev
```

The app will be available at [`http://localhost:3000`](http://localhost:3000).

### Step 4: Run tests (optional)

```bash
npm run test
```

This executes all unit/component tests.

### Step 5: Build for production

```bash
npm run build
npm run start
```

## Deployment

The app is a standard **Next.js** project and can be deployed to any environment that supports Node.js.

1. Ensure you have set the same environment variables (`NEXT_PUBLIC_*`) on the hosting platform.
2. Build the project:
   ```bash
   npm run build
   ```
3. Start the production server:
   ```bash
   npm run start
   ```
