const path = require("path");
const solc = require("solc");
const fs = require("fs-extra");

const artifactsPath = path.resolve(__dirname, "artifacts");
fs.ensureDirSync(artifactsPath);

const campaignFactoryPath = path.resolve(
  __dirname,
  "contracts",
  "CampaignFactory.sol"
);
const campaignPath = path.resolve(__dirname, "contracts", "Campaign.sol");

const campaignFactorySource = fs.readFileSync(campaignFactoryPath, "UTF-8");
const campaignSource = fs.readFileSync(campaignPath, "UTF-8");

const input = {
  language: "Solidity",
  sources: {
    "CampaignFactory.sol": {
      content: campaignFactorySource,
    },
    "Campaign.sol": {
      content: campaignSource,
    },
  },
  settings: {
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode"],
      },
    },
  },
};

const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors && output.errors.some((err) => err.severity === "error")) {
  console.error("complied with below errors:\n");
  output.errors.forEach((err) => {
    console.error(err.formattedMessage);
  });
} else {
  try {
    fs.ensureDirSync(artifactsPath);
    fs.existsSync(artifactsPath);

    for (let sourceName in output.contracts) {
      console.log("Source name:", sourceName, "\n");
      for (let contractName in output.contracts[sourceName]) {
        const outputPath = path.resolve(artifactsPath, contractName + ".json");
        fs.outputJsonSync(
          outputPath,
          output.contracts[sourceName][contractName]
        );
      }
    }
    console.log("Compilation successful!", "\n");
  } catch (err) {
    console.error("Error writing compiled contracts:", err, "\n");
  }
}
