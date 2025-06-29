export const factoryAbi = [
  {
    "type": "function",
    "name": "createCampaign",
    "stateMutability": "payable",
    "inputs": [
      { "type": "string", "name": "title" },
      { "type": "string", "name": "description" },
      { "type": "uint256", "name": "minimum" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "getDeployedCampaigns",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      { "type": "address[]" } // deployedCampaigns
    ]
  }
] as const;
