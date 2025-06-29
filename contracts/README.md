# One Consensus: Smart Contracts

This project contains the smart contracts for a decentralized, consensus-driven funding platform. The core contract implements a voting-based spending mechanism where contributors collectively approve the release of pooled funds.

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (which includes `npm`) installed on your system.

### Step 1: Install Dependencies

First, navigate to the `contracts` directory and install the required Node.js packages by running:

```bash
npm install
```

### Step 2: Configure Environment Variables

The project requires a `.env` file for sensitive data like wallet mnemonics and API keys.

1.  Make a copy of the example file: `cp .env.example .env`
2.  Open the new `.env` file and provide the two required values:

    ```
    PRIVATE_KEY="your_private_key"
    ```
    *   **`PRIVATE_KEY`**: This is the private key of an Ethereum account. For development, you should use a dedicated private key for a testnet account, not your personal wallet.
        *   **Source:** You can get your private key from MetaMask or any Ethereum wallet.
        *   **Note:** The account associated with your `PRIVATE_KEY` must have a balance of testnet ETH to pay for transaction fees (gas).
        *   **Security:** Never share your private key with anyone and never commit it to version control

    ```
    RPC_URL="your_rpc_url"
    ```
    *   **`RPC_URL`**: This is the URL of an Ethereum JSON-RPC provider that your application will use to interact with the blockchain.
        *   **Note:** Below are two commonly used options for the RPC_URL value. You can also use any other Ethereum JSON-RPC provider of your choice.

    **Option A: Using Tenderly Holesky Gateway**
    ```
    RPC_URL="https://holesky.gateway.tenderly.co/<your_access_token>"
    ```
    *   **Note:** To use this option, you need to:
        1. Sign up for a Tenderly account at [tenderly.co](https://tenderly.co)
        2. Create a new project
        3. Get your access token from your Tenderly dashboard
        4. Replace `<your_access_token>` with your actual token
    *   You can get free testnet ETH from:
        * [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet)

    **Option B: Using Sepolia Testnet**
    ```
    RPC_URL="https://sepolia.infura.io/v3/<your_project_id>"
    ```
    *   **Note:** To use this option, you need to:
        1. Sign up for an Infura account at [infura.io](https://infura.io)
        2. Create a new project
        3. Copy your Project ID from the project settings
        4. Replace `<your_project_id>` with your actual Infura Project ID
    *   You can get free testnet ETH from:
        * [Google Cloud Web3 Faucet](https://cloud.google.com/application/web3/faucet)
        * [Sepolia Faucet](https://sepolia-faucet.pk910.de/)

    **Security Note:** The `.env` file should **never** be committed to version control. The provided `.gitignore` file already excludes it.

### Step 3: Compile

Compile the smart contracts to generate the deployment artifacts:

```bash
npm run compile
```

### Step 4: Run Tests

Before deploying, verify that everything is working correctly by running the test suite:

```bash
npm run test
```

A successful run will show a series of passing tests, confirming the contract logic is sound.

### Step 5: Deploy to a Testnet

Now, deploy the contracts to an Ethereum testnet (like Sepolia):

```bash
npm run deploy
```

This command compiles the contracts and sends a transaction to the network. Upon completion, it will output the address of the deployed factory contract. **Save this address** for the next step.

## Interacting with the CampaignFactory

Before interacting with individual campaigns, you'll need to create one using the CampaignFactory contract. The factory contract is deployed during the `npm run deploy` step and its address is outputted in the console.

**Command Structure:**

```bash
npm run interact -- <factoryAddress> create-campaign <title> <description> <minimumEther>
```

*   `<factoryAddress>`: The `0x...` address of the deployed CampaignFactory contract.
*   `<title>`: A string title for your campaign (use quotes if it contains spaces)
*   `<description>`: A string description of your campaign purpose
*   `<minimumEther>`: The minimum contribution amount required to become a contributor (in ETH)

## Interacting with Campaign Contracts

After creating a campaign, you can interact with it using the campaign address.

**Command Structure:**

```bash
npm run interact -- <campaignAddress> <action> [options]
```

*   `<campaignAddress>`: The `0x...` address of a `Campaign` contract.
*   `<action>`: The function you want to call.
*   `[options]`: Any additional parameters required by the action.

### Available Actions

| Action                          | Options                                                        | Description                                                              |
| ------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `summary`                       | –                                                              | Prints a high-level summary of the campaign.                             |
| `request <requestId>`           | `requestId`: The ID of the request (shown in the requests list).                      | Shows the full details of a specific spending request.                   |
| `create <description> <eth> <recipient>` | • `description`: A string (use quotes).<br>• `eth`: An amount (e.g., 0.1).<br>• `recipient`: A `0x...` address. | Creates a new proposal to spend funds.                                   |
| `approve <requestId>`           | `requestId`: The ID of the request (shown in the requests list).                      | Cast a "yes" vote on a spending request. Requires being a contributor.   |
| `finalize <requestId>`          | `requestId`: The ID of the request (shown in the requests list).                      | Executes the fund transfer if the request has sufficient approvals.      |
| `requests [page]`               | `page`: Optional page number for pagination (default: 1)       | Lists all requests with pagination support. Shows 10 requests per page.  |
| `contribute <eth>`              | `eth`: Amount to contribute in ETH (e.g., 0.001)               | Contribute ETH to become an eligible voter. Requires at least minimum contribution. |

## Example Workflow

1.  **Create a Campaign:** First, create a new campaign using the CampaignFactory contract.
    ```bash
    # Use the factory address from deployment
    npm run interact -- 0xFactoryAddress... create-campaign "Project Funding" "Funding for open-source project development" 0.001
    ```
    * This will output the new campaign address, which you'll use in subsequent steps.

2.  **Make Contributions Using Different Accounts:**
    ```bash
    # Update your private key to a new contributors account in .env:
    PRIVATE_KEY="contributor_private_key_here"

    # Contribute to the campaign (using the campaign address from step 1):
    npm run interact -- 0x123... contribute 0.001

    # Repeat with different accounts to gather more
    ```
3.  **Create a Request:** The campaign manager (owner) can create requests.
    ```bash
    # Switch back to the managers private key in .env:
    PRIVATE_KEY="manager_private_key_here"

    # Create a request:
    npm run interact -- 0x123... create "Develop new auth module" 1.5 0xDeveloperAddress...
    ```
4.  **Approve the Request:** Only contributors (who have contributed ETH) can vote on the request.
    ```bash
    # Use one of the contributor accounts that contributed ETH:
    PRIVATE_KEY="contributor_private_key_here"

    # Approve the request:
    npm run interact -- 0x123... approve 0

    # Each contributor can only vote once per request
    ```
5.  **Finalize and Pay:** Only the campaign owner can finalize the request after it has enough approvals (more than 50% of approvers).
    ```bash
    # Switch back to the manager's private key in .env:
    PRIVATE_KEY="manager_private_key_here"

    # Finalize the request:
    npm run interact -- 0x123... finalize 0
    ```

## TODO
- Add more error handling and validation
- Add request cancellation functionality
- Add request modification functionality for the owner

## Core Concepts

*   **Testnets:** These are "playground" versions of the Ethereum blockchain (e.g., Sepolia, Goerli) that function like the real thing but use valueless Ether. They are essential for development and testing.
*   **Gas:** Every transaction on the Ethereum network requires a small fee, known as "gas." This fee compensates the miners/validators who secure the network. When deploying or interacting with contracts on a testnet, you'll need free testnet ETH to pay for gas.
