const { Web3 } = require("web3");
const dotenv = require("dotenv");
const compiledFactory = require("./artifacts/CampaignFactory.json");
const compiledCampaign = require("./artifacts/Campaign.json");

const factoryActions = ["create-campaign"];
const campaignActions = [
  "summary",
  "contribute",
  "create",
  "approve",
  "finalize",
  "request",
  "requests",
];

async function main() {
  dotenv.config();

  const args = process.argv.slice(2);
  if (args.length < 2) {
    printUsageAndExit();
  }
  const [address, action, ...params] = args;

  const { PRIVATE_KEY, RPC_URL } = process.env;
  if (!PRIVATE_KEY || !RPC_URL) {
    console.error("Error: PRIVATE_KEY and RPC_URL must be set in .env");
    process.exit(1);
  }

  const web3 = new Web3(RPC_URL);
  const privateKey = PRIVATE_KEY.startsWith("0x")
    ? PRIVATE_KEY
    : "0x" + PRIVATE_KEY;
  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);
  const from = account.address;

  console.log(`\nUsing account ${from}`);

  if (factoryActions.includes(action)) {
    await handleFactory(web3, address, action, params, from);
  } else if (campaignActions.includes(action)) {
    await handleCampaign(web3, address, action, params, from);
  } else {
    throw new Error(`Unknown action: ${action}`);
  }
}

function printUsageAndExit() {
  console.error(`
Usage:

  Campaign Creation:
    <factoryAddress> create-campaign <title> <description> <minimumEther>

  Campaign Operations:
    <campaignAddress> summary
    <campaignAddress> contribute <valueEther>
    <campaignAddress> create <description> <valueEther> <recipientAddress>
    <campaignAddress> request <requestIndex>
    <campaignAddress> approve <requestIndex>
    <campaignAddress> finalize <requestIndex>
  `);
  process.exit(1);
}

// === Factory Logic ===

async function handleFactory(web3, address, action, params, from) {
  if (action === "create-campaign") {
    await createCampaign(web3, address, params, from);
  }
}

async function createCampaign(
  web3,
  factoryAddress,
  [title, description, minimumEther],
  from
) {
  if (!title || !description || !minimumEther) {
    throw new Error(
      "create-campaign requires <title> <description> <minimumEther>"
    );
  }

  const factory = new web3.eth.Contract(compiledFactory.abi, factoryAddress);
  const minimumWei = web3.utils.toWei(minimumEther, "ether");

  console.log(
    `\nCreating campaign "${title}" with minimum ${minimumEther} ETH`
  );

  const before = await factory.methods.getDeployedCampaigns().call();
  const r = await factory.methods
    .createCampaign(title, description, minimumWei)
    .send({ from, gas: 5_000_000 });
  const after = await factory.methods.getDeployedCampaigns().call();

  if (after.length <= before.length) {
    throw new Error("Campaign creation failed");
  }

  const newAddress = after[after.length - 1];
  console.log(`\nCampaign created at: ${newAddress}`);
}

// === Campaign Logic ===

async function handleCampaign(web3, address, action, params, from) {
  const campaign = new web3.eth.Contract(compiledCampaign.abi, address);

  const actions = {
    summary: () => showSummary(web3, campaign),
    contribute: () => contribute(web3, campaign, params, from),
    requests: () => listRequests(web3, campaign, params),
    request: () => viewRequest(web3, campaign, params),
    create: () => createRequest(web3, campaign, params, from),
    approve: () => approveRequest(campaign, params, from),
    finalize: () => finalizeRequest(campaign, params, from),
  };

  const fn = actions[action];
  if (!fn) throw new Error(`Unknown action: ${action}`);
  await fn();
}

async function showSummary(web3, campaign) {
  const manager = await campaign.methods.manager().call();
  const min = web3.utils.fromWei(
    await campaign.methods.minimumContribution().call(),
    "ether"
  );
  const approvers = await campaign.methods.approversCount().call();
  const reqs = await campaign.methods.getRequestsCount().call();

  console.log(`
=== Campaign Summary ===
Manager              : ${manager}
Minimum Contribution : ${min} ETH
Approvers            : ${approvers}
Requests             : ${reqs}
  `);
}

async function contribute(web3, campaign, [valueEther], from) {
  if (!valueEther) throw new Error("contribute requires <valueEther>");
  const valueWei = web3.utils.toWei(valueEther, "ether");

  console.log(`\nContributing ${valueEther} ETH...`);
  await campaign.methods.contribute().send({ from, value: valueWei });
  console.log("\nContribution successful.");
}

async function createRequest(
  web3,
  campaign,
  [description, valueEther, recipient],
  from
) {
  if (!description || !valueEther || !recipient) {
    throw new Error(
      "create requires <description> <valueEther> <recipientAddress>"
    );
  }

  const valueWei = web3.utils.toWei(valueEther, "ether");
  console.log(
    `\nCreating request: "${description}" for ${valueEther} ETH to ${recipient}`
  );
  await campaign.methods
    .createRequest(description, valueWei, recipient)
    .send({ from });
  console.log("\nRequest created.");
}

async function approveRequest(campaign, [index], from) {
  if (index === undefined) throw new Error("approve requires <requestIndex>");
  console.log(`\nApproving request #${index}`);
  await campaign.methods.approveRequest(index).send({ from });
  console.log("\nRequest approved.");
}

async function finalizeRequest(campaign, [index], from) {
  if (index === undefined) throw new Error("finalize requires <requestIndex>");
  console.log(`\nFinalizing request #${index}`);
  await campaign.methods.finalizeRequest(index).send({ from });
  console.log("\nRequest finalized.");
}

async function viewRequest(web3, campaign, [index]) {
  if (index === undefined) throw new Error("request requires <requestIndex>");
  const r = await campaign.methods.requests(index).call();

  console.log(`
=== Request #${index} ===
Description  : ${r[0]}
Value        : ${web3.utils.fromWei(r[1], "ether")} ETH
Recipient    : ${r[2]}
Complete     : ${r[3]}
ApprovalCount: ${r[4]}
  `);
}

async function listRequests(web3, campaign, [pageArg]) {
  const page = Number(pageArg || 1);
  const perPage = 10;
  const start = BigInt((page - 1) * perPage);

  const totalStr = await campaign.methods.getRequestsCount().call();
  const total = BigInt(totalStr);

  if (start >= total) {
    throw new Error(`Page ${page} out of range (total: ${total})`);
  }

  for (let i = start; i < total && i < start + BigInt(perPage); i++) {
    const r = await campaign.methods.requests(i.toString()).call();
    console.log(`
=== Request #${i} ===
Description  : ${r[0]}
Value        : ${web3.utils.fromWei(r[1], "ether")} ETH
Recipient    : ${r[2]}
Complete     : ${r[3]}
ApprovalCount: ${r[4]}
    `);
  }
}

// === Entry Point ===

if (require.main === module) {
  main().catch((err) => console.error("\nError:", err.message));
}
