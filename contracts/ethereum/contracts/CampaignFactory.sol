// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Campaign.sol";

contract CampaignFactory {
    address[] public deployedCampaigns;

    function getDeployedCampaigns() public view returns (address[] memory) {
        return deployedCampaigns;
    }

    function createCampaign(string memory title, string memory description, uint256 minimum) public {
        Campaign newCampaign = new Campaign(title, description, minimum, msg.sender);
        deployedCampaigns.push(address(newCampaign));
    }
}
