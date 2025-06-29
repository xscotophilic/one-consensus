require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { Web3 } = require("web3");
const compiledFactory = require(path.resolve(
  __dirname,
  "artifacts",
  "CampaignFactory.json"
));

if (!process.env.PRIVATE_KEY || !process.env.RPC_URL) {
  console.error(
    "\nError: Make sure PRIVATE_KEY and RPC_URL are set in your .env file."
  );
  return;
}

const web3 = new Web3(process.env.RPC_URL);

const deploy = async () => {
  const privateKey = process.env.PRIVATE_KEY.startsWith("0x")
    ? process.env.PRIVATE_KEY
    : "0x" + process.env.PRIVATE_KEY;

  const account = web3.eth.accounts.privateKeyToAccount(privateKey);
  web3.eth.accounts.wallet.add(account);

  const balance = await web3.eth.getBalance(account.address);
  const balanceEth = web3.utils.fromWei(balance, "ether");

  console.log(`\nUsing deployment account: ${account.address}`);
  console.log(`\nAccount balance: ${balanceEth} ETH`);

  try {
    const factoryResult = await new web3.eth.Contract(compiledFactory.abi)
      .deploy({ data: "0x" + compiledFactory.evm.bytecode.object })
      .send({ from: account.address, gas: 3000000 });

    const factoryAddress = factoryResult.options.address;
    console.log(`\nFactory deployed to: ${factoryAddress}`);

    const network = String(await web3.eth.getChainId());
    const deploymentsDir = path.resolve(__dirname, "..", "deployments");
    const filePath = path.join(deploymentsDir, `${network}.json`);

    fs.mkdirSync(deploymentsDir, { recursive: true });

    let data = {};
    try {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        data = JSON.parse(fileContent);
      }
    } catch (error) {
      console.warn(`Error: Could not read deployments file: ${error.message}`);
    }

    if (!Array.isArray(data[network])) {
      data[network] = [];
    }

    let blockNumber = null;

    try {
      blockNumber = (await web3.eth.getBlockNumber()).toString();
    } catch (error) {
      console.warn(`Error: Could not get block number: ${error.message}`);
    }

    data[network].push({
      factory: factoryAddress,
      block_number: blockNumber,
      timestamp: Date.now(),
    });

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`\nDeployment record saved to deployments/${network}.json`);
  } catch (err) {
    if (err.message && err.message.includes("insufficient funds")) {
      console.error("\nError: Insufficient funds for deployment.");
    } else {
      console.error(`\nAn unexpected error occurred: ${err.message}`);
    }
  }
};

deploy();
