import { ethers, network, run } from "hardhat";
import { Contract, ContractFactory, Signer } from "ethers";

async function main() {
  let token: Contract;
  let Token: ContractFactory;
  const MINT_AMOUNT: number = 1000000000;
  const WAIT_BLOCK_CONFIRMATIONS = 6;

  Token = await ethers.getContractFactory("TestToken");
  token = await Token.deploy(
    "MockToken",
    "MTK",
    ethers.utils.parseEther(MINT_AMOUNT.toString())
  );

  await token.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);

  console.log(`Contract deployed to ${token.address}`);

  console.log(`Verifying Token contract on Etherscan...`);

  await run(`verify:verify`, {
    address: token.address,
    constructorArguments: [
      "MockToken",
      "MTK",
      ethers.utils.parseEther(MINT_AMOUNT.toString()),
    ],
  });
  const TokenAddress = token.address;

  const StakingContract = await ethers.getContractFactory("Staking");
  const stakingContract = await StakingContract.deploy(TokenAddress, 10);

  await stakingContract.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);

  console.log(
    `Contract deployed to ${stakingContract.address} on ${network.name}`
  );

  console.log(`Verifying contract on Etherscan...`);

  await run(`verify:verify`, {
    address: stakingContract.address,
    constructorArguments: [TokenAddress, 10],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
