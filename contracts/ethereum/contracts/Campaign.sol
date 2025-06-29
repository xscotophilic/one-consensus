// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Campaign {
    struct Request {
        string description;
        uint256 value;
        address payable recipient;
        bool complete;
        uint256 approvalCount;
        mapping(address => bool) approvals;
    }

    string public title;
    string public description;
    uint256 public minimumContribution;
    address public manager;

    mapping(address => bool) public approvers;
    uint256 public approversCount;
    Request[] public requests;

    constructor(string memory _title, string memory _description, uint256 minimum, address creator) {
        title = _title;
        description = _description;
        minimumContribution = minimum;
        manager = creator;
    }

    modifier restricted() {
        require(msg.sender == manager, "Only manager can call this.");
        _;
    }

    function contribute() public payable {
        require(msg.value >= minimumContribution, "Contribution below minimum.");
        if (!approvers[msg.sender]) {
            approvers[msg.sender] = true;
            approversCount++;
        }
    }

    function getRequestsCount() public view returns (uint256) {
        return requests.length;
    }

    function createRequest(string memory description, uint256 value, address payable recipient) public {
        require(msg.sender == manager, "Only the campaign owner can create requests");
        Request storage newRequest = requests.push();
        newRequest.description = description;
        newRequest.value = value;
        newRequest.recipient = recipient;
        newRequest.complete = false;
        newRequest.approvalCount = 0;
    }

    function hasApproved(uint index, address approver) public view returns (bool) {
        require(index < requests.length, "Invalid request index");
        return requests[index].approvals[approver];
    }

    function approveRequest(uint256 index) public {
        Request storage request = requests[index];
        require(approvers[msg.sender], "Not an approver.");
        require(!request.approvals[msg.sender], "Already approved.");
        request.approvals[msg.sender] = true;
        request.approvalCount++;
    }

    function finalizeRequest(uint256 index) public {
        bytes20 sender = bytes20(msg.sender);
        bytes20 managerAddr = bytes20(manager);
        require(sender == managerAddr, "Only the campaign owner can finalize requests");

        Request storage request = requests[index];
        require(!request.complete, "Request already finalized.");
        require(request.approvalCount >= (approversCount / 2), "Not enough approvals.");
        request.recipient.transfer(request.value);
        request.complete = true;
    }

    function getSummary() public view returns (
        string memory, string memory, uint256, uint256, uint256, uint256, address
    ) {
        return (
            title,
            description,
            minimumContribution,
            address(this).balance,
            requests.length,
            approversCount,
            manager
        );
    }
}
