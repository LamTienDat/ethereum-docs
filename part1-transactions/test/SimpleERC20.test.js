const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

/**
 * Test Suite cho SimpleERC20 Contract
 * 
 * Mục đích: Học cách viết tests cho smart contracts
 */

describe("SimpleERC20", function () {
  // Fixture để deploy contract
  async function deployTokenFixture() {
    const [owner, addr1, addr2] = await ethers.getSigners();

    const TOKEN_NAME = "Test Token";
    const TOKEN_SYMBOL = "TEST";
    const TOKEN_DECIMALS = 18;
    const INITIAL_SUPPLY = ethers.parseUnits("1000000", TOKEN_DECIMALS);

    const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
    const token = await SimpleERC20.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      TOKEN_DECIMALS,
      INITIAL_SUPPLY
    );

    return { token, owner, addr1, addr2, INITIAL_SUPPLY, TOKEN_DECIMALS };
  }

  describe("Deployment", function () {
    it("Nên set đúng token name", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.name()).to.equal("Test Token");
    });

    it("Nên set đúng token symbol", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.symbol()).to.equal("TEST");
    });

    it("Nên set đúng decimals", async function () {
      const { token } = await loadFixture(deployTokenFixture);
      expect(await token.decimals()).to.equal(18);
    });

    it("Nên mint toàn bộ supply cho owner", async function () {
      const { token, owner, INITIAL_SUPPLY } = await loadFixture(deployTokenFixture);
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(INITIAL_SUPPLY);
    });

    it("Nên set đúng total supply", async function () {
      const { token, INITIAL_SUPPLY } = await loadFixture(deployTokenFixture);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY);
    });

    it("Nên emit Transfer event khi deploy", async function () {
      const [owner] = await ethers.getSigners();
      const TOKEN_NAME = "Test Token";
      const TOKEN_SYMBOL = "TEST";
      const TOKEN_DECIMALS = 18;
      const INITIAL_SUPPLY = ethers.parseUnits("1000000", TOKEN_DECIMALS);

      const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
      
      await expect(
        SimpleERC20.deploy(TOKEN_NAME, TOKEN_SYMBOL, TOKEN_DECIMALS, INITIAL_SUPPLY)
      )
        .to.emit(SimpleERC20, "Transfer")
        .withArgs(ethers.ZeroAddress, owner.address, INITIAL_SUPPLY);
    });
  });

  describe("transfer()", function () {
    it("Nên chuyển token thành công", async function () {
      const { token, owner, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await expect(token.transfer(addr1.address, amount))
        .to.changeTokenBalances(token, [owner, addr1], [-amount, amount]);
    });

    it("Nên emit Transfer event", async function () {
      const { token, owner, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await expect(token.transfer(addr1.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr1.address, amount);
    });

    it("Nên revert nếu không đủ số dư", async function () {
      const { token, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      // addr1 không có token
      await expect(
        token.connect(addr1).transfer(addr1.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Nên revert nếu transfer đến zero address", async function () {
      const { token, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await expect(
        token.transfer(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });

    it("Nên transfer 0 token thành công", async function () {
      const { token, addr1 } = await loadFixture(deployTokenFixture);

      await expect(token.transfer(addr1.address, 0))
        .to.emit(token, "Transfer")
        .withArgs(token.target, addr1.address, 0);
    });
  });

  describe("approve()", function () {
    it("Nên approve thành công", async function () {
      const { token, owner, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await token.approve(addr1.address, amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount);
    });

    it("Nên emit Approval event", async function () {
      const { token, owner, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await expect(token.approve(addr1.address, amount))
        .to.emit(token, "Approval")
        .withArgs(owner.address, addr1.address, amount);
    });

    it("Nên revert nếu approve cho zero address", async function () {
      const { token, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await expect(
        token.approve(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Cannot approve zero address");
    });

    it("Nên update allowance khi approve lại", async function () {
      const { token, owner, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount1 = ethers.parseUnits("100", TOKEN_DECIMALS);
      const amount2 = ethers.parseUnits("200", TOKEN_DECIMALS);

      await token.approve(addr1.address, amount1);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount1);

      await token.approve(addr1.address, amount2);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(amount2);
    });
  });

  describe("transferFrom()", function () {
    it("Nên transferFrom thành công khi đã approve", async function () {
      const { token, owner, addr1, addr2, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      // Owner approve cho addr1
      await token.approve(addr1.address, amount);

      // addr1 transferFrom owner -> addr2
      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      ).to.changeTokenBalances(token, [owner, addr2], [-amount, amount]);
    });

    it("Nên emit Transfer event", async function () {
      const { token, owner, addr1, addr2, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await token.approve(addr1.address, amount);

      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, amount)
      )
        .to.emit(token, "Transfer")
        .withArgs(owner.address, addr2.address, amount);
    });

    it("Nên giảm allowance sau transferFrom", async function () {
      const { token, owner, addr1, addr2, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const approveAmount = ethers.parseUnits("200", TOKEN_DECIMALS);
      const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await token.approve(addr1.address, approveAmount);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount);

      const remainingAllowance = await token.allowance(owner.address, addr1.address);
      expect(remainingAllowance).to.equal(approveAmount - transferAmount);
    });

    it("Nên revert nếu không đủ allowance", async function () {
      const { token, owner, addr1, addr2, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const approveAmount = ethers.parseUnits("50", TOKEN_DECIMALS);
      const transferAmount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await token.approve(addr1.address, approveAmount);

      await expect(
        token.connect(addr1).transferFrom(owner.address, addr2.address, transferAmount)
      ).to.be.revertedWith("Insufficient allowance");
    });

    it("Nên revert nếu from không đủ số dư", async function () {
      const { token, addr1, addr2, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      // addr1 approve cho addr2 (nhưng addr1 không có token)
      await token.connect(addr1).approve(addr2.address, amount);

      await expect(
        token.connect(addr2).transferFrom(addr1.address, addr2.address, amount)
      ).to.be.revertedWith("Insufficient balance");
    });

    it("Nên revert nếu from là zero address", async function () {
      const { token, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await expect(
        token.transferFrom(ethers.ZeroAddress, addr1.address, amount)
      ).to.be.revertedWith("Cannot transfer from zero address");
    });

    it("Nên revert nếu to là zero address", async function () {
      const { token, owner, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await token.approve(addr1.address, amount);

      await expect(
        token.connect(addr1).transferFrom(owner.address, ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Cannot transfer to zero address");
    });
  });

  describe("mint()", function () {
    it("Nên mint token thành công", async function () {
      const { token, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await token.mint(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Nên tăng total supply sau mint", async function () {
      const { token, addr1, INITIAL_SUPPLY, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await token.mint(addr1.address, amount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY + amount);
    });

    it("Nên emit Transfer event từ zero address", async function () {
      const { token, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await expect(token.mint(addr1.address, amount))
        .to.emit(token, "Transfer")
        .withArgs(ethers.ZeroAddress, addr1.address, amount);
    });

    it("Nên revert nếu mint đến zero address", async function () {
      const { token, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await expect(
        token.mint(ethers.ZeroAddress, amount)
      ).to.be.revertedWith("Cannot mint to zero address");
    });
  });

  describe("burn()", function () {
    it("Nên burn token thành công", async function () {
      const { token, owner, INITIAL_SUPPLY, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await token.burn(amount);
      expect(await token.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY - amount);
    });

    it("Nên giảm total supply sau burn", async function () {
      const { token, INITIAL_SUPPLY, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await token.burn(amount);
      expect(await token.totalSupply()).to.equal(INITIAL_SUPPLY - amount);
    });

    it("Nên emit Transfer event đến zero address", async function () {
      const { token, owner, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      await expect(token.burn(amount))
        .to.emit(token, "Transfer")
        .withArgs(owner.address, ethers.ZeroAddress, amount);
    });

    it("Nên revert nếu không đủ số dư để burn", async function () {
      const { token, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("1000", TOKEN_DECIMALS);

      // addr1 không có token
      await expect(
        token.connect(addr1).burn(amount)
      ).to.be.revertedWith("Insufficient balance to burn");
    });
  });

  describe("Gas Optimization", function () {
    it("Nên đo gas cho transfer", async function () {
      const { token, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      const tx = await token.transfer(addr1.address, amount);
      const receipt = await tx.wait();
      
      console.log(`      Gas used for transfer: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(100000); // Nên < 100k gas
    });

    it("Nên đo gas cho approve", async function () {
      const { token, addr1, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      const tx = await token.approve(addr1.address, amount);
      const receipt = await tx.wait();
      
      console.log(`      Gas used for approve: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });

    it("Nên đo gas cho transferFrom", async function () {
      const { token, owner, addr1, addr2, TOKEN_DECIMALS } = await loadFixture(deployTokenFixture);
      const amount = ethers.parseUnits("100", TOKEN_DECIMALS);

      await token.approve(addr1.address, amount);
      
      const tx = await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);
      const receipt = await tx.wait();
      
      console.log(`      Gas used for transferFrom: ${receipt.gasUsed.toString()}`);
      expect(receipt.gasUsed).to.be.lessThan(100000);
    });
  });
});

