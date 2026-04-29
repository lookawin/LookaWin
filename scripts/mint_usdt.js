const { ethers } = require("hardhat");
async function main() {
  const usdt = await ethers.getContractAt("MockUSDT", process.env.USDT_ADDR);
  const signers = await ethers.getSigners();
  for (let i = 1; i < 5; i++) {
    await usdt.mint(signers[i].address, 10000n * 1000000n);
    console.log("Minté 10 000 USDT pour", signers[i].address);
  }
}
main().catch(console.error);
