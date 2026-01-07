// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title EcosystemRewards
 * @notice Distributes 50M tokens to PROMPT holders at graduation
 * @dev Snapshot-based distribution proportional to PROMPT holdings
 *
 * V7 Ecosystem Rewards:
 * - 50M tokens (5% of total supply) per agent graduation
 * - Distributed proportionally to PROMPT holders
 * - Snapshot taken at graduation time
 * - Claimable by eligible PROMPT holders
 *
 * Example:
 * - Total PROMPT supply: 100M
 * - Your PROMPT holdings: 1M (1%)
 * - Your reward: 50M * 1% = 500K agent tokens
 */
contract EcosystemRewards is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant ECOSYSTEM_ALLOCATION = 50_000_000e18; // 50M tokens

    struct RewardSchedule {
        uint256 totalAmount;        // 50M tokens
        uint256 totalClaimed;       // Total claimed so far
        uint256 snapshotTime;       // When snapshot was taken
        uint256 totalPromptSnapshot; // Total PROMPT supply at snapshot
    }

    struct HolderReward {
        uint256 amount;             // Reward amount for this holder
        bool claimed;               // Whether claimed
    }

    // agentToken => RewardSchedule
    mapping(address => RewardSchedule) public schedules;

    // agentToken => holder => HolderReward
    mapping(address => mapping(address => HolderReward)) public rewards;

    event RewardsSet(
        address indexed agentToken,
        uint256 totalAmount,
        uint256 holderCount,
        uint256 snapshotTime
    );

    event RewardClaimed(
        address indexed agentToken,
        address indexed holder,
        uint256 amount
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set rewards for PROMPT holders (called by GraduationManager)
     * @param agentToken Agent token address
     * @param holders Array of PROMPT holder addresses (from snapshot)
     * @param amounts Array of reward amounts (proportional to PROMPT holdings)
     * @param totalPromptSnapshot Total PROMPT supply at snapshot time
     */
    function setRewards(
        address agentToken,
        address[] calldata holders,
        uint256[] calldata amounts,
        uint256 totalPromptSnapshot
    ) external onlyOwner {
        require(schedules[agentToken].totalAmount == 0, "Already set");
        require(holders.length == amounts.length, "Length mismatch");

        // Verify amounts sum to ECOSYSTEM_ALLOCATION
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        require(totalAmount == ECOSYSTEM_ALLOCATION, "Amount mismatch");

        // Set schedule
        schedules[agentToken] = RewardSchedule({
            totalAmount: ECOSYSTEM_ALLOCATION,
            totalClaimed: 0,
            snapshotTime: block.timestamp,
            totalPromptSnapshot: totalPromptSnapshot
        });

        // Set individual rewards
        for (uint256 i = 0; i < holders.length; i++) {
            if (amounts[i] > 0) {
                rewards[agentToken][holders[i]] = HolderReward({
                    amount: amounts[i],
                    claimed: false
                });
            }
        }

        emit RewardsSet(agentToken, ECOSYSTEM_ALLOCATION, holders.length, block.timestamp);
    }

    /**
     * @notice Claim ecosystem reward
     * @param agentToken Agent token address
     */
    function claim(address agentToken) external {
        HolderReward storage reward = rewards[agentToken][msg.sender];
        require(reward.amount > 0, "No reward");
        require(!reward.claimed, "Already claimed");

        reward.claimed = true;
        schedules[agentToken].totalClaimed += reward.amount;

        IERC20(agentToken).safeTransfer(msg.sender, reward.amount);

        emit RewardClaimed(agentToken, msg.sender, reward.amount);
    }

    /**
     * @notice Check if holder has unclaimed reward
     * @param agentToken Agent token address
     * @param holder Holder address
     * @return amount Claimable amount (0 if already claimed or no reward)
     */
    function getClaimableAmount(address agentToken, address holder) external view returns (uint256 amount) {
        HolderReward memory reward = rewards[agentToken][holder];
        if (reward.claimed || reward.amount == 0) return 0;
        return reward.amount;
    }

    /**
     * @notice Get reward info for a holder
     * @param agentToken Agent token address
     * @param holder Holder address
     */
    function getRewardInfo(address agentToken, address holder) external view returns (
        uint256 amount,
        bool claimed,
        uint256 snapshotTime
    ) {
        HolderReward memory reward = rewards[agentToken][holder];
        RewardSchedule memory schedule = schedules[agentToken];

        return (
            reward.amount,
            reward.claimed,
            schedule.snapshotTime
        );
    }

    /**
     * @notice Get overall schedule info
     * @param agentToken Agent token address
     */
    function getScheduleInfo(address agentToken) external view returns (
        uint256 totalAmount,
        uint256 totalClaimed,
        uint256 remaining,
        uint256 snapshotTime,
        uint256 totalPromptSnapshot
    ) {
        RewardSchedule memory schedule = schedules[agentToken];

        return (
            schedule.totalAmount,
            schedule.totalClaimed,
            schedule.totalAmount - schedule.totalClaimed,
            schedule.snapshotTime,
            schedule.totalPromptSnapshot
        );
    }

    /**
     * @notice Batch claim for multiple agents
     * @param agentTokens Array of agent token addresses
     */
    function batchClaim(address[] calldata agentTokens) external {
        for (uint256 i = 0; i < agentTokens.length; i++) {
            HolderReward storage reward = rewards[agentTokens[i]][msg.sender];
            if (reward.amount > 0 && !reward.claimed) {
                reward.claimed = true;
                schedules[agentTokens[i]].totalClaimed += reward.amount;
                IERC20(agentTokens[i]).safeTransfer(msg.sender, reward.amount);
                emit RewardClaimed(agentTokens[i], msg.sender, reward.amount);
            }
        }
    }
}
