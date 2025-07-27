# One Consensus

One Consensus is a simple, proof-of-concept project that explores how groups of people can pool resources and make decisions together using blockchain technology.

## Why does it exist?

Traditional crowdfunding and decision-making platforms rely on a central authority. One Consensus shows an alternative approach where the rules are baked into code and executed on a decentralized network, giving all participants equal visibility and control.

## How does it work?

One Consensus is a decentralized platform that allows groups of people to pool resources and make decisions together using blockchain technology. It works by creating a smart contract that enforces the rules of the platform and executes decisions on a decentralized network.

### Example Workflow

Here’s what using One Consensus looks like from a non-technical perspective:

1. **Start a Campaign** – Someone describes their idea and sets a minimum contribution.
2. **Chip In** – Supporters contribute small amounts of ETH, gaining a say in how the money is spent.
3. **Suggest Spending** – The campaign’s manager proposes how to use the pooled funds (e.g., pay a supplier).
4. **Community Vote** – Every contributor can vote **yes** or **no** on each proposal.
5. **Funds Released** – Once a majority approves, the campaign manager finalizes the request and the funds are sent to the recipient.

This ensures the community—not a central authority—decides where the money goes.

### How the Voting Mechanism Works

1. Contributors send Ether to the contract to become approvers.
2. The manager proposes payment requests with a description, value, and recipient address.
3. Each contributor can vote **yes** once per request.
4. When more than 50% (configurable) approve, the manager finalizes the request, sending funds to the recipient.

This ensures transparent, democratic fund allocation.

## What are the benefits?

One Consensus offers several benefits over traditional crowdfunding and decision-making platforms:

1. Decentralization: All participants have equal visibility and control over the platform, and decisions are executed on a decentralized network.
2. Transparency: All transactions and decisions are recorded on a blockchain, making it transparent and tamper-proof.
3. Security: The platform is built on top of blockchain technology, which is known for its security and immutability.

## Detailed Module Documentation

This root `README.md` provides a high-level overview of the project architecture. For detailed instructions on setup, development, and building, please refer to the `README.md` files within each primary module directory:

```
├── frontend
│   └── README.md
├── smart-contract
│   └── README.md
└── README.md
```

Each module’s README contains module-specific guidance to help you get started quickly and contribute effectively.
