// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/RewardDistributor.sol";
import "../contracts/TeamMilestoneVesting.sol";
import "../contracts/TeamTimeVesting.sol";
import "../contracts/EcosystemRewards.sol";
import "../contracts/LPLocker.sol";
import "../contracts/GraduationManagerV7.sol";

/**
 * @title DeployV7
 * @notice Deployment script for V7 bonding curve contracts
 * @dev Run with: forge script script/DeployV7.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify
 *
 * Required environment variables:
 * - PRIVATE_KEY: Deployer private key
 *
 * Base Sepolia addresses:
 * - PROMPT Token: 0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673
 * - Vault: 0xBaFe4E2C27f1c0bb8e562262Dd54E3F1BB959140
 * - Uniswap Factory: 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6
 * - Uniswap Router: 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24
 *
 * V7 Changes from V6:
 * - TeamMilestoneVesting (250M with FDV milestones) replaces TeamVesting
 * - TeamTimeVesting (200M with 1yr cliff + 6mo vest) - NEW
 * - EcosystemRewards (50M for PROMPT holders) - NEW
 * - GraduationManagerV7 with fixed LP allocation (140M)
 * - Graduation threshold: 42,160 PROMPT
 */
contract DeployV7 is Script {
    // Base Sepolia addresses
    address constant PROMPT_TOKEN = 0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673;
    address constant VAULT = 0xBaFe4E2C27f1c0bb8e562262Dd54E3F1BB959140;
    address constant UNISWAP_FACTORY = 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6;
    address constant UNISWAP_ROUTER = 0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("Deploying V7 contracts to Base Sepolia...");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy RewardDistributor (5% holder rewards with 30-day vest)
        RewardDistributor rewardDistributor = new RewardDistributor(deployer);
        console.log("1. RewardDistributor deployed at:", address(rewardDistributor));

        // 2. Deploy TeamMilestoneVesting (250M with FDV milestones)
        TeamMilestoneVesting teamMilestoneVesting = new TeamMilestoneVesting(deployer);
        console.log("2. TeamMilestoneVesting deployed at:", address(teamMilestoneVesting));

        // 3. Deploy TeamTimeVesting (200M with 1yr cliff + 6mo vest)
        TeamTimeVesting teamTimeVesting = new TeamTimeVesting(deployer);
        console.log("3. TeamTimeVesting deployed at:", address(teamTimeVesting));

        // 4. Deploy EcosystemRewards (50M for PROMPT holders)
        EcosystemRewards ecosystemRewards = new EcosystemRewards(deployer);
        console.log("4. EcosystemRewards deployed at:", address(ecosystemRewards));

        // 5. Deploy LPLocker (locks 95% LP for 3 years)
        LPLocker lpLocker = new LPLocker();
        console.log("5. LPLocker deployed at:", address(lpLocker));

        // 6. Deploy GraduationManagerV7
        GraduationManagerV7 graduationManager = new GraduationManagerV7(
            PROMPT_TOKEN,
            VAULT,
            UNISWAP_FACTORY,
            UNISWAP_ROUTER,
            address(rewardDistributor),
            address(teamMilestoneVesting),
            address(teamTimeVesting),
            address(ecosystemRewards),
            address(lpLocker),
            deployer // initialOwner - will be platform backend
        );
        console.log("6. GraduationManagerV7 deployed at:", address(graduationManager));

        // 7. Transfer ownership of all vesting contracts to GraduationManager
        rewardDistributor.transferOwnership(address(graduationManager));
        console.log("   -> RewardDistributor ownership transferred");

        teamMilestoneVesting.transferOwnership(address(graduationManager));
        console.log("   -> TeamMilestoneVesting ownership transferred");

        teamTimeVesting.transferOwnership(address(graduationManager));
        console.log("   -> TeamTimeVesting ownership transferred");

        ecosystemRewards.transferOwnership(address(graduationManager));
        console.log("   -> EcosystemRewards ownership transferred");

        vm.stopBroadcast();

        // Print summary
        console.log("");
        console.log("===========================================");
        console.log("V7 DEPLOYMENT SUMMARY");
        console.log("===========================================");
        console.log("");
        console.log("Contracts deployed:");
        console.log("  RewardDistributor:      ", address(rewardDistributor));
        console.log("  TeamMilestoneVesting:   ", address(teamMilestoneVesting));
        console.log("  TeamTimeVesting:        ", address(teamTimeVesting));
        console.log("  EcosystemRewards:       ", address(ecosystemRewards));
        console.log("  LPLocker:               ", address(lpLocker));
        console.log("  GraduationManagerV7:    ", address(graduationManager));
        console.log("");
        console.log("External dependencies:");
        console.log("  PROMPT Token:           ", PROMPT_TOKEN);
        console.log("  Vault:                  ", VAULT);
        console.log("  Uniswap Factory:        ", UNISWAP_FACTORY);
        console.log("  Uniswap Router:         ", UNISWAP_ROUTER);
        console.log("");
        console.log("===========================================");
        console.log("NEXT STEPS");
        console.log("===========================================");
        console.log("1. Add contract addresses to Supabase secrets:");
        console.log("   - GRADUATION_MANAGER_V7_ADDRESS");
        console.log("   - REWARD_DISTRIBUTOR_ADDRESS");
        console.log("   - TEAM_MILESTONE_VESTING_ADDRESS");
        console.log("   - TEAM_TIME_VESTING_ADDRESS");
        console.log("   - ECOSYSTEM_REWARDS_ADDRESS");
        console.log("   - LP_LOCKER_ADDRESS");
        console.log("");
        console.log("2. Update src/lib/contractsV7.ts with addresses");
        console.log("");
        console.log("3. Verify contracts on BaseScan:");
        console.log("   forge verify-contract <address> <contract> --chain base-sepolia");
        console.log("");
        console.log("4. Test graduation flow end-to-end");
        console.log("===========================================");
    }
}
