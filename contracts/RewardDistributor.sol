// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RewardDistributor
 * @notice Distributes 5% holder rewards with 1-month linear vesting
 * @dev Claim-based model - users claim their own vested rewards
 * 
 * Key Features:
 * - 1-month linear vesting (not cliff)
 * - Claim-based model (users pay their own gas)
 * - Set once per agent at graduation
 * - Query vested amount at any time
 * - Partial claims allowed
 */
contract RewardDistributor is Ownable {
    using SafeERC20 for IERC20;
    
    uint256 public constant VEST_DURATION = 30 days; // 1 month
    
    struct RewardInfo {
        uint256 totalAmount;  // Total reward allocated
        uint256 claimed;      // Amount already claimed
        uint256 startTime;    // Vesting start time (graduation)
    }
    
    // agentToken => holder => RewardInfo
    mapping(address => mapping(address => RewardInfo)) public rewards;
    
    // agentToken => graduation timestamp
    mapping(address => uint256) public graduationTimes;
    
    event RewardsSet(
        address indexed agentToken,
        address indexed holder,
        uint256 amount,
        uint256 startTime
    );
    
    event RewardsClaimed(
        address indexed agentToken,
        address indexed holder,
        uint256 amount
    );
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @notice Set rewards for multiple holders (called by GraduationManager)
     * @param agentToken The agent token address
     * @param holders Array of holder addresses
     * @param amounts Array of reward amounts (must match holders length)
     */
    function setRewards(
        address agentToken,
        address[] calldata holders,
        uint256[] calldata amounts
    ) external onlyOwner {
        require(holders.length == amounts.length, "Length mismatch");
        require(graduationTimes[agentToken] == 0, "Already set");
        
        uint256 startTime = block.timestamp;
        graduationTimes[agentToken] = startTime;
        
        for (uint256 i = 0; i < holders.length; i++) {
            rewards[agentToken][holders[i]] = RewardInfo({
                totalAmount: amounts[i],
                claimed: 0,
                startTime: startTime
            });
            
            emit RewardsSet(agentToken, holders[i], amounts[i], startTime);
        }
    }
    
    /**
     * @notice Calculate vested amount for a holder
     * @param holder Holder address
     * @param agentToken Agent token address
     * @return vested Amount currently vested and claimable
     */
    function calculateVestedAmount(
        address holder,
        address agentToken
    ) public view returns (uint256 vested) {
        RewardInfo memory info = rewards[agentToken][holder];
        
        if (info.totalAmount == 0) return 0;
        
        uint256 elapsed = block.timestamp - info.startTime;
        
        if (elapsed >= VEST_DURATION) {
            // Fully vested
            vested = info.totalAmount - info.claimed;
        } else {
            // Partial vesting (linear)
            uint256 totalVested = (info.totalAmount * elapsed) / VEST_DURATION;
            vested = totalVested - info.claimed;
        }
        
        return vested;
    }
    
    /**
     * @notice Claim vested rewards
     * @param agentToken Agent token address
     */
    function claimRewards(address agentToken) external {
        uint256 claimable = calculateVestedAmount(msg.sender, agentToken);
        require(claimable > 0, "No rewards claimable");
        
        RewardInfo storage info = rewards[agentToken][msg.sender];
        info.claimed += claimable;
        
        IERC20(agentToken).safeTransfer(msg.sender, claimable);
        
        emit RewardsClaimed(agentToken, msg.sender, claimable);
    }
    
    /**
     * @notice Get reward info for a holder
     * @param holder Holder address
     * @param agentToken Agent token address
     * @return totalAmount Total reward amount
     * @return claimed Amount already claimed
     * @return claimable Amount currently claimable
     * @return startTime Vesting start time
     * @return timeRemaining Time until fully vested
     */
    function getRewardInfo(
        address holder,
        address agentToken
    ) external view returns (
        uint256 totalAmount,
        uint256 claimed,
        uint256 claimable,
        uint256 startTime,
        uint256 timeRemaining
    ) {
        RewardInfo memory info = rewards[agentToken][holder];
        claimable = calculateVestedAmount(holder, agentToken);
        
        uint256 elapsed = block.timestamp - info.startTime;
        timeRemaining = elapsed >= VEST_DURATION ? 0 : VEST_DURATION - elapsed;
        
        return (
            info.totalAmount,
            info.claimed,
            claimable,
            info.startTime,
            timeRemaining
        );
    }
}
