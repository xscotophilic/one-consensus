export const campaignAbi = [
  {
    "type": "function",
    "name": "getSummary",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      { "type": "string" }, // title
      { "type": "string" }, // description
      { "type": "uint256" }, // minimumContribution
      { "type": "uint256" }, // balance
      { "type": "uint256" }, // requests
      { "type": "uint256" }, // approvers
      { "type": "address" }  // manager
    ]
  },
  {
    "type": "function",
    "name": "contribute",
    "stateMutability": "payable",
    "inputs": [],
    "outputs": []
  },
  {
    "type": "function",
    "name": "createRequest",
    "stateMutability": "nonpayable",
    "inputs": [
      { "type": "string" }, // description
      { "type": "uint256" }, // value
      { "type": "address" }  // recipient
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "getRequestsCount",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      { "type": "uint256" } // count
    ]
  },
  {
    "type": "function",
    "name": "requests",
    "stateMutability": "view",
    "inputs": [
      { "type": "uint256" } // index
    ],
    "outputs": [
      { "type": "string" }, // description
      { "type": "uint256" }, // value
      { "type": "address" }, // recipient
      { "type": "bool" }, // complete
      { "type": "uint256" }, // approvalCount
    ]
  },
  {
    "type": "function",
    "name": "approvers",
    "stateMutability": "view",
    "inputs": [
      { "type": "address" } // address
    ],
    "outputs": [
      { "type": "bool" } // isApprover
    ]
  },
  {
    "type": "function",
    "name": "hasApproved",
    "stateMutability": "view",
    "inputs": [
      { "type": "uint256" }, // index
      { "type": "address" }  // approver
    ],
    "outputs": [
      { "type": "bool" } // hasApproved
    ]
  },
  {
    "type": "function",
    "name": "approveRequest",
    "stateMutability": "nonpayable",
    "inputs": [
      { "type": "uint256" } // index
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "finalizeRequest",
    "stateMutability": "nonpayable",
    "inputs": [
      { "type": "uint256" } // index
    ],
    "outputs": []
  }
] as const;
