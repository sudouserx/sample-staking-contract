import { ethers } from "hardhat";

async function main() {

  const Staking = await ethers.getContractFactory("Staking");
  const staking = await Staking.deploy(process.env.TOKEN_ADDRESS ?? "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", process.env.REWARD_RATE ?? "5");

  await staking.deployed();

  console.log(
    `Staking contract deployed to ${staking.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
