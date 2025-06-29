const assert = require("assert");
const hre = require("hardhat");
const { Web3 } = require("web3");

let provider;
let web3;

const compiledFactory = require("../ethereum/artifacts/CampaignFactory.json");
const compiledCampaign = require("../ethereum/artifacts/Campaign.json");

let accounts;
let factory;
let campaignAddress;
let campaign;

beforeEach(async () => {
  provider = hre.network.provider;
  if (typeof provider.setMaxListeners === "function") {
    provider.setMaxListeners(0); // 0 = unlimited
  }
  web3 = new Web3(provider);
  accounts = await web3.eth.getAccounts();

  factory = await new web3.eth.Contract(compiledFactory.abi)
    .deploy({
      data: compiledFactory.evm.bytecode.object,
    })
    .send({
      from: accounts[0],
      gas: "3000000",
    });

  await factory.methods
    .createCampaign(
      "Test Campaign",
      "This is a test campaign for testing purposes",
      "100"
    )
    .send({
      from: accounts[0],
      gas: "5000000",
    });

  [campaignAddress] = await factory.methods.getDeployedCampaigns().call();

  campaign = await new web3.eth.Contract(compiledCampaign.abi, campaignAddress);
});

describe("Campaign Contract", () => {
  describe("Deployment", () => {
    it("deploys a factoy and campaign!", () => {
      assert.ok(factory.options.address);
      assert.ok(campaign.options.address);
    });

    it("should assign creator as campaign manager", async () => {
      const manager = await campaign.methods.manager().call();
      assert.equal(accounts[0], manager);
    });
  });

  describe("Contributions", () => {
    it("should accept valid contribution and mark approver", async () => {
      await campaign.methods.contribute().send({
        value: "100",
        from: accounts[1],
      });
      const isApprover = await campaign.methods.approvers(accounts[1]).call();
      assert(isApprover);
    });

    it("should reject contribution below minimum", async () => {
      try {
        await campaign.methods.contribute().send({
          value: "10",
          from: accounts[1],
        });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });

    it("should not double-count approver", async () => {
      const before = await campaign.methods.approversCount().call();
      await campaign.methods
        .contribute()
        .send({ value: "200", from: accounts[4] });
      await campaign.methods
        .contribute()
        .send({ value: "300", from: accounts[4] });
      const after = await campaign.methods.approversCount().call();
      assert.equal(Number(before) + 1, Number(after));
    });
  });

  describe("Request Creation", () => {
    it("allows a manager to make a payment request!", async () => {
      await campaign.methods.createRequest("test", 90, accounts[1]).send({
        from: accounts[0],
        gas: "1000000",
      });

      const requestCount = await campaign.methods.getRequestsCount().call();
      assert.equal(1, requestCount);
    });

    it("should reject request creation by non-manager", async () => {
      try {
        await campaign.methods
          .createRequest("Should fail", 100, accounts[2])
          .send({
            from: accounts[1],
            gas: "1000000",
          });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });
  });

  describe("Request Approval", () => {
    it("should process a request end-to-end", async () => {
      await campaign.methods.contribute().send({
        from: accounts[0],
        value: web3.utils.toWei("10", "ether"),
      });

      await campaign.methods
        .createRequest("test", web3.utils.toWei("5", "ether"), accounts[1])
        .send({
          from: accounts[0],
          gas: "1000000",
        });

      await campaign.methods.approveRequest(0).send({
        from: accounts[0],
        gas: "1000000",
      });

      await campaign.methods.finalizeRequest(0).send({
        from: accounts[0],
        gas: "1000000",
      });

      let balance = await web3.eth.getBalance(accounts[1]);
      balance = web3.utils.fromWei(balance, "ether");
      balance = parseFloat(balance);
      assert(balance > 0);
    });

    it("prevents double approval of the same request", async () => {
      await campaign.methods.contribute().send({
        value: "200",
        from: accounts[1],
      });

      await campaign.methods.createRequest("test", 150, accounts[2]).send({
        from: accounts[0],
        gas: "1000000",
      });

      await campaign.methods.approveRequest(0).send({
        from: accounts[1],
        gas: "1000000",
      });

      try {
        await campaign.methods.approveRequest(0).send({
          from: accounts[1],
          gas: "1000000",
        });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });

    it("should reject approval by non-approver", async () => {
      await campaign.methods
        .createRequest("need", 100, accounts[2])
        .send({ from: accounts[0], gas: "1000000" });
      try {
        await campaign.methods
          .approveRequest(0)
          .send({ from: accounts[4], gas: "1000000" });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });

    it("should reflect correct approval status", async () => {
      await campaign.methods
        .contribute()
        .send({ value: "150", from: accounts[1] });
      await campaign.methods
        .createRequest("need", 100, accounts[2])
        .send({ from: accounts[0], gas: "1000000" });
      let approved = await campaign.methods.hasApproved(0, accounts[1]).call();
      assert.equal(approved, false);
      await campaign.methods
        .approveRequest(0)
        .send({ from: accounts[1], gas: "1000000" });
      approved = await campaign.methods.hasApproved(0, accounts[1]).call();
      assert.equal(approved, true);
    });
  });

  describe("Request Finalization", () => {
    it("should reject finalization by non-manager", async () => {
      await campaign.methods.contribute().send({
        value: web3.utils.toWei("1", "ether"),
        from: accounts[1],
      });

      await campaign.methods
        .contribute()
        .send({ value: "150", from: accounts[0] });
      await campaign.methods
        .createRequest(
          "buy materials",
          web3.utils.toWei("0.5", "ether"),
          accounts[2]
        )
        .send({
          from: accounts[0],
          gas: "1000000",
        });

      await campaign.methods
        .approveRequest(0)
        .send({ from: accounts[0], gas: "1000000" });
      await campaign.methods
        .approveRequest(0)
        .send({ from: accounts[1], gas: "1000000" });

      try {
        await campaign.methods.finalizeRequest(0).send({
          from: accounts[1],
          gas: "1000000",
        });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });

    it("should reject finalization without sufficient approvals", async () => {
      await campaign.methods.contribute().send({
        value: web3.utils.toWei("1", "ether"),
        from: accounts[1],
      });
      await campaign.methods.contribute().send({
        value: web3.utils.toWei("1", "ether"),
        from: accounts[2],
      });

      await campaign.methods
        .createRequest(
          "buy supplies",
          web3.utils.toWei("0.5", "ether"),
          accounts[2]
        )
        .send({
          from: accounts[0],
          gas: "1000000",
        });

      try {
        await campaign.methods.finalizeRequest(0).send({
          from: accounts[0],
          gas: "1000000",
        });
        assert(false);
      } catch (err) {
        assert(err);
      }

      await campaign.methods
        .contribute()
        .send({ value: "200", from: accounts[0] });

      await campaign.methods
        .approveRequest(0)
        .send({ from: accounts[0], gas: "1000000" });
      await campaign.methods
        .approveRequest(0)
        .send({ from: accounts[1], gas: "1000000" });

      await campaign.methods
        .finalizeRequest(0)
        .send({ from: accounts[0], gas: "1000000" });

      const recipientBalance = parseFloat(
        web3.utils.fromWei(await web3.eth.getBalance(accounts[2]), "ether")
      );
      assert(recipientBalance > 0);
    });

    it("should track approvers count correctly", async () => {
      await campaign.methods.contribute().send({
        value: "200",
        from: accounts[2],
      });

      await campaign.methods.contribute().send({
        value: "300",
        from: accounts[2],
      });

      await campaign.methods.contribute().send({
        value: "200",
        from: accounts[3],
      });

      const count = await campaign.methods.approversCount().call();
      assert.equal(count, 2);
    });

    it("should revert if request already finalized", async () => {
      await campaign.methods
        .contribute()
        .send({ value: "200", from: accounts[0] });
      await campaign.methods
        .contribute()
        .send({ value: "200", from: accounts[1] });

      await campaign.methods
        .createRequest("dup", 100, accounts[2])
        .send({ from: accounts[0], gas: "1000000" });
      await campaign.methods
        .approveRequest(0)
        .send({ from: accounts[0], gas: "1000000" });
      await campaign.methods
        .approveRequest(0)
        .send({ from: accounts[1], gas: "1000000" });
      await campaign.methods
        .finalizeRequest(0)
        .send({ from: accounts[0], gas: "1000000" });

      try {
        await campaign.methods
          .finalizeRequest(0)
          .send({ from: accounts[0], gas: "1000000" });
        assert(false);
      } catch (err) {
        assert(err);
      }
    });
  });

  describe("Summary", () => {
    it("should return correct metadata", async () => {
      const summary = await campaign.methods.getSummary().call();
      assert.equal(summary[0], "Test Campaign");
      assert.equal(summary[1], "This is a test campaign for testing purposes");
      assert.equal(summary[2], "100");
      assert.equal(summary[6], accounts[0]);
    });
  });
});
