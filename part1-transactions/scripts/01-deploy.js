const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * Script 1: Deploy SimpleERC20 Contract
 * 
 * Mục đích:
 * - Học cách deploy smart contract lên testnet
 * - Quan sát gas cost cho deployment
 * - Verify contract trên Etherscan
 * 
 * Chạy: npx hardhat run scripts/01-deploy.js --network sepolia
 */

async function main() {
  console.log("🚀 Bắt đầu deploy SimpleERC20 contract...\n");

  // Lấy thông tin deployer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying từ địa chỉ:", deployer.address);

  // Kiểm tra số dư
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Số dư:", ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.log("❌ Không có ETH! Vui lòng xin Sepolia ETH từ faucet:");
    console.log("   - https://sepoliafaucet.com/");
    console.log("   - https://www.alchemy.com/faucets/ethereum-sepolia\n");
    return;
  }

  // Thông số token
  const TOKEN_NAME = "Kaopiz Coin";
  const TOKEN_SYMBOL = "KPC";
  const TOKEN_DECIMALS = 18;
  const INITIAL_SUPPLY = ethers.parseUnits("1000000", TOKEN_DECIMALS); // 1 triệu token

  console.log("📋 Thông số token:");
  console.log("   Name:", TOKEN_NAME);
  console.log("   Symbol:", TOKEN_SYMBOL);
  console.log("   Decimals:", TOKEN_DECIMALS);
  console.log("   Initial Supply:", ethers.formatUnits(INITIAL_SUPPLY, TOKEN_DECIMALS), TOKEN_SYMBOL);
  console.log();

  // Deploy contract
  console.log("⏳ Đang deploy contract...");
  const SimpleERC20 = await ethers.getContractFactory("SimpleERC20");
  const token = await SimpleERC20.deploy(
    TOKEN_NAME,
    TOKEN_SYMBOL,
    TOKEN_DECIMALS,
    INITIAL_SUPPLY
  );

  // Đợi deployment hoàn tất
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();

  console.log("✅ Deploy thành công!");
  console.log("📍 Contract address:", tokenAddress);
  console.log();

  // Lấy thông tin deployment transaction
  const deployTx = token.deploymentTransaction();
  if (deployTx) {
    console.log("📊 Deployment Transaction:");
    console.log("   Transaction Hash:", deployTx.hash);
    console.log("   Block Number:", deployTx.blockNumber);
    console.log("   Gas Used:", deployTx.gasLimit.toString());
    console.log("   Gas Price:", ethers.formatUnits(deployTx.gasPrice || 0n, "gwei"), "gwei");
    
    // Tính cost
    const cost = (deployTx.gasLimit * (deployTx.gasPrice || 0n));
    console.log("   Deployment Cost:", ethers.formatEther(cost), "ETH");
    console.log();
  }

  // Verify thông tin token
  console.log("🔍 Verify thông tin token:");
  const name = await token.name();
  const symbol = await token.symbol();
  const decimals = await token.decimals();
  const totalSupply = await token.totalSupply();
  const deployerBalance = await token.balanceOf(deployer.address);

  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Decimals:", decimals);
  console.log("   Total Supply:", ethers.formatUnits(totalSupply, decimals), symbol);
  console.log("   Deployer Balance:", ethers.formatUnits(deployerBalance, decimals), symbol);
  console.log();

  // Lưu địa chỉ contract
  console.log("💾 Lưu địa chỉ contract vào file deployed-address.txt");
  const fs = require("fs");
  fs.writeFileSync(
    "deployed-address.txt",
    `Contract Address: ${tokenAddress}\n` +
    `Network: Sepolia\n` +
    `Deployer: ${deployer.address}\n` +
    `Deployment Time: ${new Date().toISOString()}\n`
  );

  // Hướng dẫn verify trên Etherscan
  console.log("📝 Để verify contract trên Etherscan, chạy lệnh:");
  console.log(`   npx hardhat verify --network sepolia ${tokenAddress} "${TOKEN_NAME}" "${TOKEN_SYMBOL}" ${TOKEN_DECIMALS} "${INITIAL_SUPPLY}"`);
  console.log();

  // Links
  console.log("🔗 Links:");
  console.log(`   Etherscan: https://sepolia.etherscan.io/address/${tokenAddress}`);
  console.log(`   Transaction: https://sepolia.etherscan.io/tx/${deployTx?.hash}`);
  console.log();

  console.log("✨ Deploy hoàn tất! Giờ bạn có thể chạy các script khác.");
  console.log("   Tiếp theo: npx hardhat run scripts/02-transfer-eth.js --network sepolia");
}

// Xử lý lỗi
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Lỗi:", error);
    process.exit(1);
  });

