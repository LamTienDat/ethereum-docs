const { ethers } = require("hardhat");
const fs = require("fs");
require("dotenv").config();

/**
 * Script 4: Demo approve() and transferFrom()
 * 
 * Purpose:
 * - Understand the flow of approve/transferFrom
 * - Use case: DEX, Payment Gateway, Staking
 * - Check allowance
 * 
 * Run: npx hardhat run scripts/04-approve-transferFrom.js --network sepolia
 */

async function main() {
  console.log("🔐 Demo: approve() and transferFrom()\n");
  console.log("=".repeat(60));
  console.log();

  // Read contract address
  let contractAddress;
  try {
    const deployedInfo = fs.readFileSync("deployed-address.txt", "utf8");
    const match = deployedInfo.match(/Contract Address: (0x[a-fA-F0-9]{40})/);
    if (match) {
      contractAddress = match[1];
    } else {
      throw new Error("Contract address not found");
    }
  } catch (error) {
    console.log("❌ Contract not deployed yet!");
    console.log("   Please run: npx hardhat run scripts/01-deploy.js --network sepolia");
    return;
  }

  console.log("📍 Contract Address:", contractAddress);
  console.log();

  // Connect to contract
  const [owner] = await ethers.getSigners();
  const token = await ethers.getContractAt("SimpleERC20", contractAddress);

  // Get token information
  const symbol = await token.symbol();
  const decimals = await token.decimals();

  console.log("🪙 Token:", symbol);
  console.log();

  // Scenario: Owner approves another address (simulating DEX/Gateway)
  const spenderAddress = process.env.RECIPIENT_ADDRESS || "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb";
  
  console.log("📖 Scenario:");
  console.log("   Owner (you) wants to allow Spender (DEX/Gateway) to");
  console.log("   withdraw up to 500 tokens from your wallet.");
  console.log();
  console.log("👤 Owner:", owner.address);
  console.log("👤 Spender:", spenderAddress);
  console.log();

  // Check balance
  const ownerBalance = await token.balanceOf(owner.address);
  console.log("💰 Owner Balance:", ethers.formatUnits(ownerBalance, decimals), symbol);
  console.log();

  // Check current allowance
  console.log("🔍 Check current allowance:");
  const currentAllowance = await token.allowance(owner.address, spenderAddress);
  console.log(`   Allowance: ${ethers.formatUnits(currentAllowance, decimals)} ${symbol}`);
  console.log();

  // ========== STEP 1: APPROVE ==========
  console.log("=" .repeat(60));
  console.log("STEP 1: Owner approves Spender");
  console.log("=".repeat(60));
  console.log();

  const approveAmount = ethers.parseUnits("500", decimals); // 500 tokens
  console.log("💰 Approve amount:", ethers.formatUnits(approveAmount, decimals), symbol);
  console.log();

  // Estimate gas
  const estimatedGasApprove = await token.approve.estimateGas(spenderAddress, approveAmount);
  console.log("📊 Estimated Gas:", estimatedGasApprove.toString());
  console.log();

  // Send approve transaction
  console.log("⏳ Sending approve transaction...");
  const approveTx = await token.approve(spenderAddress, approveAmount);
  console.log("✅ Approve transaction sent!");
  console.log("📍 TX Hash:", approveTx.hash);
  console.log();

  // Wait for confirmation
  console.log("⏳ Waiting for confirmation...");
  const approveReceipt = await approveTx.wait();
  console.log("✅ Approve confirmed!");
  console.log(`   Gas Used: ${approveReceipt.gasUsed.toString()}`);
  console.log();

  // Parse Approval event
  for (const log of approveReceipt.logs) {
    try {
      const parsedLog = token.interface.parseLog({
        topics: [...log.topics],
        data: log.data
      });
      
      if (parsedLog && parsedLog.name === "Approval") {
        console.log("📡 Event: Approval");
        console.log(`   - Owner: ${parsedLog.args.owner}`);
        console.log(`   - Spender: ${parsedLog.args.spender}`);
        console.log(`   - Value: ${ethers.formatUnits(parsedLog.args.value, decimals)} ${symbol}`);
      }
    } catch (e) {}
  }
  console.log();

  // Check allowance after approve
  const newAllowance = await token.allowance(owner.address, spenderAddress);
  console.log("🔍 Allowance after approve:");
  console.log(`   ${ethers.formatUnits(newAllowance, decimals)} ${symbol}`);
  console.log();

  // ========== STEP 2: TRANSFER FROM (Simulated) ==========
  console.log("=".repeat(60));
  console.log("STEP 2: Spender uses transferFrom()");
  console.log("=".repeat(60));
  console.log();

  console.log("💡 Note:");
  console.log("   In practice, Spender (DEX/Gateway) will call transferFrom()");
  console.log("   Here we simulate by having Owner call transferFrom()");
  console.log("   (because we only have 1 test wallet)");
  console.log();

  // Amount to transfer
  const transferAmount = ethers.parseUnits("100", decimals); // 100 tokens
  console.log("💰 Transfer amount:", ethers.formatUnits(transferAmount, decimals), symbol);
  console.log();

  // Recipient address (could be exchange, staking pool, etc.)
  const recipientAddress = spenderAddress; // In practice could be different address

  console.log("📊 Before transferFrom:");
  const ownerBalanceBefore = await token.balanceOf(owner.address);
  const recipientBalanceBefore = await token.balanceOf(recipientAddress);
  const allowanceBefore = await token.allowance(owner.address, owner.address);
  
  console.log(`   Owner balance: ${ethers.formatUnits(ownerBalanceBefore, decimals)} ${symbol}`);
  console.log(`   Recipient balance: ${ethers.formatUnits(recipientBalanceBefore, decimals)} ${symbol}`);
  console.log(`   Allowance: ${ethers.formatUnits(newAllowance, decimals)} ${symbol}`);
  console.log();

  // Estimate gas
  const estimatedGasTransferFrom = await token.transferFrom.estimateGas(
    owner.address,
    recipientAddress,
    transferAmount
  );
  console.log("📊 Estimated Gas:", estimatedGasTransferFrom.toString());
  console.log();

  // Send transferFrom transaction
  console.log("⏳ Sending transferFrom transaction...");
  const transferFromTx = await token.transferFrom(
    owner.address,
    recipientAddress,
    transferAmount
  );
  console.log("✅ TransferFrom transaction sent!");
  console.log("📍 TX Hash:", transferFromTx.hash);
  console.log();

  // Wait for confirmation
  console.log("⏳ Waiting for confirmation...");
  const transferFromReceipt = await transferFromTx.wait();
  console.log("✅ TransferFrom confirmed!");
  console.log(`   Gas Used: ${transferFromReceipt.gasUsed.toString()}`);
  console.log();

  // Parse Transfer event
  for (const log of transferFromReceipt.logs) {
    try {
      const parsedLog = token.interface.parseLog({
        topics: [...log.topics],
        data: log.data
      });
      
      if (parsedLog && parsedLog.name === "Transfer") {
        console.log("📡 Event: Transfer");
        console.log(`   - From: ${parsedLog.args.from}`);
        console.log(`   - To: ${parsedLog.args.to}`);
        console.log(`   - Value: ${ethers.formatUnits(parsedLog.args.value, decimals)} ${symbol}`);
      }
    } catch (e) {}
  }
  console.log();

  // Check after transferFrom
  console.log("📊 After transferFrom:");
  const ownerBalanceAfter = await token.balanceOf(owner.address);
  const recipientBalanceAfter = await token.balanceOf(recipientAddress);
  const allowanceAfter = await token.allowance(owner.address, owner.address);
  
  console.log(`   Owner balance: ${ethers.formatUnits(ownerBalanceAfter, decimals)} ${symbol}`);
  console.log(`   Recipient balance: ${ethers.formatUnits(recipientBalanceAfter, decimals)} ${symbol}`);
  console.log(`   Remaining allowance: ${ethers.formatUnits(allowanceAfter, decimals)} ${symbol}`);
  console.log();

  // Calculate changes
  console.log("📈 Changes:");
  console.log(`   Owner: -${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
  console.log(`   Recipient: +${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
  console.log(`   Allowance: -${ethers.formatUnits(transferAmount, decimals)} ${symbol}`);
  console.log();

  // ========== EXPLANATION ==========
  console.log("=".repeat(60));
  console.log("💡 Flow Explanation");
  console.log("=".repeat(60));
  console.log();

  console.log("1️⃣ approve(spender, amount):");
  console.log("   - Owner allows Spender to withdraw up to 'amount' tokens");
  console.log("   - Stored in mapping: allowance[owner][spender] = amount");
  console.log("   - Emit event: Approval(owner, spender, amount)");
  console.log();

  console.log("2️⃣ transferFrom(from, to, amount):");
  console.log("   - Spender calls this to withdraw tokens from Owner");
  console.log("   - Check: allowance[from][msg.sender] >= amount");
  console.log("   - Check: balanceOf[from] >= amount");
  console.log("   - Deduct allowance: allowance[from][msg.sender] -= amount");
  console.log("   - Transfer tokens: from -> to");
  console.log("   - Emit event: Transfer(from, to, amount)");
  console.log();

  console.log("🎯 Real-world Use Cases:");
  console.log();
  console.log("   📊 DEX (Uniswap, PancakeSwap):");
  console.log("      - User approves DEX contract");
  console.log("      - When swapping, DEX calls transferFrom() to get tokens");
  console.log();
  console.log("   💳 Payment Gateway:");
  console.log("      - User approves gateway");
  console.log("      - When paying, gateway automatically deducts funds");
  console.log();
  console.log("   🏦 Staking:");
  console.log("      - User approves staking contract");
  console.log("      - Contract withdraws tokens to stake");
  console.log();
  console.log("   🎮 GameFi:");
  console.log("      - User approves game contract");
  console.log("      - Game automatically deducts when buying items");
  console.log();

  console.log("⚠️ Security Notes:");
  console.log("   - Only approve audited contracts");
  console.log("   - Don't approve unlimited (type(uint256).max) unless trusted");
  console.log("   - Can revoke by approve(spender, 0)");
  console.log("   - Check allowance before approving more (avoid front-running)");
  console.log();

  console.log("✨ Demo complete!");
  console.log("   Next: npx hardhat run scripts/05-nonce-demo.js --network sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });

