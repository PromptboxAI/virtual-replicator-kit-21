// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/RewardDistributor.sol";
import "../contracts/TeamVesting.sol";
import "../contracts/LPLocker.sol";
import "../contracts/GraduationManagerV6.sol";
import "../contracts/AgentFactoryV6.sol";

/**
 * @title DeployV6
 * @notice Deployment script for V6 bonding curve contracts
 * @dev Run with: forge script script/DeployV6.s.sol --rpc-url $BASE_SEPOLIA_RPC --broadcast --verify
 * 
 * Required environment variables:
 * - PRIVATE_KEY: Deployer private key
 * 
 * Base Sepolia addresses:
 * - PROMPT Token: 0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673
 * - Vault: 0xbafe4e2c27f1c0bb8e562262dd54e3f1bb959140
 * - Uniswap Factory: 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6
 * - Uniswap Router: 0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24
 */
contract DeployV6 is Script {
    // Base Sepolia addresses
    address constant PROMPT_TOKEN = 0x04d30a1697FdaDAFd647B46ef2253F4Dccf17673;
    address constant VAULT = 0xbafe4e2c27f1c0bb8e562262dd54e3f1bb959140;
    address constant UNISWAP_FACTORY = 0x8909Dc15e40173Ff4699343b6eB8132c65e18eC6;
    address constant UNISWAP_ROUTER = 0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying V6 contracts...");
        console.log("Deployer:", deployer);
        console.log("");
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy RewardDistributor (owner = deployer initially)
        RewardDistributor rewardDistributor = new RewardDistributor(deployer);
        console.log("RewardDistributor deployed at:", address(rewardDistributor));

        // 2. Deploy TeamVesting (owner = deployer initially)
        TeamVesting teamVesting = new TeamVesting(deployer);
        console.log("TeamVesting deployed at:", address(teamVesting));

        // 3. Deploy LPLocker (no owner needed)
        LPLocker lpLocker = new LPLocker();
        console.log("LPLocker deployed at:", address(lpLocker));

        // 4. Deploy GraduationManagerV6
        GraduationManagerV6 graduationManager = new GraduationManagerV6(
            PROMPT_TOKEN,
            VAULT,
            UNISWAP_FACTORY,
            UNISWAP_ROUTER,
            address(rewardDistributor),
            address(teamVesting),
            address(lpLocker),
            deployer // initialOwner - will be platform backend
        );
        console.log("GraduationManagerV6 deployed at:", address(graduationManager));

        // 5. Transfer ownership of RewardDistributor and TeamVesting to GraduationManager
        rewardDistributor.transferOwnership(address(graduationManager));
        console.log("RewardDistributor ownership transferred to GraduationManager");
        
        teamVesting.transferOwnership(address(graduationManager));
        console.log("TeamVesting ownership transferred to GraduationManager");

        // 6. Deploy AgentFactoryV6
        AgentFactoryV6 agentFactory = new AgentFactoryV6(
            PROMPT_TOKEN,
            VAULT,
            address(graduationManager)
        );
        console.log("AgentFactoryV6 deployed at:", address(agentFactory));

        vm.stopBroadcast();

        // Print summary
        console.log("");
        console.log("========== DEPLOYMENT SUMMARY ==========");
        console.log("RewardDistributor:", address(rewardDistributor));
        console.log("TeamVesting:", address(teamVesting));
        console.log("LPLocker:", address(lpLocker));
        console.log("GraduationManagerV6:", address(graduationManager));
        console.log("AgentFactoryV6:", address(agentFactory));
        console.log("");
        console.log("Next steps:");
        console.log("1. Add these addresses to Supabase secrets");
        console.log("2. Update src/lib/contractsV6.ts with deployed addresses");
        console.log("3. Verify contracts on BaseScan");
        console.log("=========================================");
    }
}
