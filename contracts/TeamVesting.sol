// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TeamVesting
 * @notice Vests 10% team allocation with cliff vesting
 * @dev 50% unlocks at 3 months, 50% at 6 months
 * 
 * Key Features:
 * - Cliff vesting (not linear): 50% @ 3mo, 50% @ 6mo
 * - Single beneficiary (creator/team wallet)
 * - Set once at graduation
 * - Query next unlock time
 */
contract TeamVesting is Ownable {
    using SafeERC20 for IERC20;
    
    uint256 public constant CLIFF_1 = 90 days;   // 3 months
    uint256 public constant CLIFF_2 = 180 days;  // 6 months
    
    struct VestingSchedule {
        uint256 totalAmount;      // Total team allocation (100M tokens)
        uint256 claimed;          // Amount already claimed
        uint256 startTime;        // Vesting start time (graduation)
        address beneficiary;      // Team wallet/creator
    }
    
    // agentToken => VestingSchedule
    mapping(address => VestingSchedule) public schedules;
    
    event VestingSet(
        address indexed agentToken,
        address indexed beneficiary,
        uint256 amount,
        uint256 startTime
    );
    
    event TokensClaimed(
        address indexed agentToken,
        address indexed beneficiary,
        uint256 amount
    );
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @notice Set vesting schedule (called by GraduationManager at graduation)
     * @param agentToken Agent token address
     * @param beneficiary Team wallet (usually creator)
     * @param amount Total team allocation (100M tokens)
     */
    function setVesting(
        address agentToken,
        address beneficiary,
        uint256 amount
    ) external onlyOwner {
        require(schedules[agentToken].totalAmount == 0, "Already set");
        require(beneficiary != address(0), "Invalid beneficiary");
        
        schedules[agentToken] = VestingSchedule({
            totalAmount: amount,
            claimed: 0,
            startTime: block.timestamp,
            beneficiary: beneficiary
        });
        
        emit VestingSet(agentToken, beneficiary, amount, block.timestamp);
    }
    
    /**
     * @notice Calculate claimable amount (cliff vesting)
     * @param agentToken Agent token address
     * @return Claimable amount
     */
    function calculateClaimable(address agentToken) public view returns (uint256) {
        VestingSchedule memory schedule = schedules[agentToken];
        
        if (schedule.totalAmount == 0) return 0;
        
        uint256 elapsed = block.timestamp - schedule.startTime;
        uint256 totalVested = 0;
        
        if (elapsed >= CLIFF_2) {
            // Both cliffs passed - 100% vested
            totalVested = schedule.totalAmount;
        } else if (elapsed >= CLIFF_1) {
            // First cliff passed - 50% vested
            totalVested = schedule.totalAmount / 2;
        }
        // else: No cliffs passed yet - 0% vested
        
        return totalVested - schedule.claimed;
    }
    
    /**
     * @notice Claim vested tokens
     * @param agentToken Agent token address
     */
    function claim(address agentToken) external {
        VestingSchedule storage schedule = schedules[agentToken];
        require(msg.sender == schedule.beneficiary, "Not beneficiary");
        
        uint256 claimable = calculateClaimable(agentToken);
        require(claimable > 0, "No tokens claimable");
        
        schedule.claimed += claimable;
        
        IERC20(agentToken).safeTransfer(msg.sender, claimable);
        
        emit TokensClaimed(agentToken, msg.sender, claimable);
    }
    
    /**
     * @notice Get vesting info
     * @param agentToken Agent token address
     * @return totalAmount Total vesting amount
     * @return claimed Amount claimed
     * @return claimable Currently claimable
     * @return cliff1Time Timestamp of first cliff
     * @return cliff2Time Timestamp of second cliff
     * @return beneficiary Beneficiary address
     */
    function getVestingInfo(address agentToken) external view returns (
        uint256 totalAmount,
        uint256 claimed,
        uint256 claimable,
        uint256 cliff1Time,
        uint256 cliff2Time,
        address beneficiary
    ) {
        VestingSchedule memory schedule = schedules[agentToken];
        claimable = calculateClaimable(agentToken);
        
        return (
            schedule.totalAmount,
            schedule.claimed,
            claimable,
            schedule.startTime + CLIFF_1,
            schedule.startTime + CLIFF_2,
            schedule.beneficiary
        );
    }
}
