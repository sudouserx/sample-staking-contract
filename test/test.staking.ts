import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Contract, ContractFactory, Signer } from 'ethers';

describe('Staking', () => {
  let Staking: ContractFactory;
  let Token: ContractFactory;
  let staking: Contract;
  let token: Contract;
  let owner: Signer;
  let addr1: Signer;
  let addr2: Signer;
  let addrs: Signer[];
  const REWARD_RATE: number = 10;
  const STAKE_AMOUNT: number= 100;
  const ONE_HOUR: number = 3600; // in seconds
  const DEFAULT_BALANCE: number = 1000;
  const HUNDRED_PERCENT: number = 100;
  const MINT_AMOUNT: number = 1000000000;
  const REWARD_POOL: number = 100000000;

  beforeEach(async () => {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    Token = await ethers.getContractFactory('TestToken');
    token = await Token.deploy('MockToken', 'MTK', ethers.utils.parseEther(MINT_AMOUNT.toString()));

    Staking = await ethers.getContractFactory('Staking');
    staking = await Staking.deploy(token.address, REWARD_RATE);

    await token.transfer(await addr1.getAddress(), ethers.utils.parseEther(DEFAULT_BALANCE.toString()));
    await token.transfer(await addr2.getAddress(), ethers.utils.parseEther(DEFAULT_BALANCE.toString()));
    await token.transfer(await staking.address, ethers.utils.parseEther(REWARD_POOL.toString()));
  });

  it('should allow users to stake tokens', async () => {
    await token.connect(addr1).approve(staking.address, ethers.utils.parseEther(STAKE_AMOUNT.toString()));

    expect(await staking.connect(addr1).stake(ethers.utils.parseEther(STAKE_AMOUNT.toString()))).to.not.reverted;
  });

  it('should allow users to unstake tokens', async () => {
    await token.connect(addr1).approve(staking.address, ethers.utils.parseEther(STAKE_AMOUNT.toString()));
    await staking.connect(addr1).stake(ethers.utils.parseEther(STAKE_AMOUNT.toString()));

    await ethers.provider.send('evm_increaseTime', [ONE_HOUR]); // Increase time by 1 hour
    await ethers.provider.send('evm_mine', []);


    expect(await staking.connect(addr1).unstake(ethers.utils.parseEther('50'))).not.be.reverted;
  });

  it('should calculate rewards correctly', async () => {
    await token.connect(addr1).approve(staking.address, ethers.utils.parseEther(STAKE_AMOUNT.toString()));
    await staking.connect(addr1).stake(ethers.utils.parseEther(STAKE_AMOUNT.toString()));

    await ethers.provider.send('evm_increaseTime', [ONE_HOUR]); // Increase time by 1 hour
    await ethers.provider.send('evm_mine', []);

    const expectedReward = ethers.utils.parseEther((STAKE_AMOUNT * REWARD_RATE * ONE_HOUR / HUNDRED_PERCENT).toString())

    expect(await staking.calculateReward(await addr1.getAddress())).to.equal(expectedReward);
  });

  it('should allow users to claim rewards', async () => {
    await token.connect(addr1).approve(staking.address, ethers.utils.parseEther(STAKE_AMOUNT.toString()));
    await staking.connect(addr1).stake(ethers.utils.parseEther(STAKE_AMOUNT.toString()));

    await ethers.provider.send('evm_increaseTime', [ONE_HOUR]); // Increase time by 1 hour
    await ethers.provider.send('evm_mine', []);

    await staking.connect(addr1).claimReward();

    // claiming reward one second later 
    const expectedReward = ethers.utils.parseEther((STAKE_AMOUNT * REWARD_RATE * (ONE_HOUR+1) / HUNDRED_PERCENT).toString())

    expect(await token.balanceOf(await addr1.getAddress())).to.equal(
      ethers.utils.parseEther(DEFAULT_BALANCE.toString()).sub(ethers.utils
        .parseEther(STAKE_AMOUNT.toString())).add(expectedReward),
    );
  });
});
