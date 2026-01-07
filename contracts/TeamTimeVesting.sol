// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TeamTimeVesting
 * @notice Vests 200M team tokens with time-based schedule
 * @dev 1-year cliff, then 6-month linear vest
 *
 * V7 Time Vesting Schedule:
 * - Month 0-12: 0% (cliff period)
 * - Month 13-18: Linear unlock (~33.3M per month)
 * - Month 18+: 100% vested (200M total)
 *
 * Example:
 * - Month 12: 0 claimable (cliff not passed)
 * - Month 13: ~33.3M claimable
 * - Month 15: ~100M claimable
 * - Month 18: 200M claimable (all)
 */
contract TeamTimeVesting is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant TOTAL_ALLOCATION = 200_000_000e18; // 200M tokens
    uint256 public constant CLIFF_DURATION = 365 days;         // 1 year cliff
    uint256 public constant VEST_DURATION = 180 days;          // 6 months linear vest after cliff

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimed;
        uint256 startTime;
        address beneficiary;
    }

    // agentToken => VestingSchedule
    mapping(address => VestingSchedule) public schedules;

    event VestingSet(
        address indexed agentToken,
        address indexed beneficiary,
        uint256 amount,
        uint256 startTime,
        uint256 cliffEnd,
        uint256 vestEnd
    );

    event TokensClaimed(
        address indexed agentToken,
        address indexed beneficiary,
        uint256 amount,
        uint256 totalClaimed
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set vesting schedule (called by GraduationManager at graduation)
     * @param agentToken Agent token address
     * @param beneficiary Team wallet (usually creator)
     */
    function setVesting(
        address agentToken,
        address beneficiary
    ) external onlyOwner {
        require(schedules[agentToken].totalAmount == 0, "Already set");
        require(beneficiary != address(0), "Invalid beneficiary");

        schedules[agentToken] = VestingSchedule({
            totalAmount: TOTAL_ALLOCATION,
            claimed: 0,
            startTime: block.timestamp,
            beneficiary: beneficiary
        });

        emit VestingSet(
            agentToken,
            beneficiary,
            TOTAL_ALLOCATION,
            block.timestamp,
            block.timestamp + CLIFF_DURATION,
            block.timestamp + CLIFF_DURATION + VEST_DURATION
        );
    }

    /**
     * @notice Calculate vested amount (before subtracting claimed)
     * @param agentToken Agent token address
     * @return totalVested Amount vested so far
     */
    function calculateVested(address agentToken) public view returns (uint256 totalVested) {
        VestingSchedule memory schedule = schedules[agentToken];
        if (schedule.totalAmount == 0) return 0;

        uint256 elapsed = block.timestamp - schedule.startTime;

        if (elapsed < CLIFF_DURATION) {
            // Still in cliff period
            return 0;
        }

        uint256 elapsedAfterCliff = elapsed - CLIFF_DURATION;

        if (elapsedAfterCliff >= VEST_DURATION) {
            // Fully vested
            return schedule.totalAmount;
        }

        // Linear vesting after cliff
        return (schedule.totalAmount * elapsedAfterCliff) / VEST_DURATION;
    }

    /**
     * @notice Calculate claimable amount
     * @param agentToken Agent token address
     * @return Claimable amount
     */
    function calculateClaimable(address agentToken) public view returns (uint256) {
        VestingSchedule memory schedule = schedules[agentToken];
        if (schedule.totalAmount == 0) return 0;

        uint256 vested = calculateVested(agentToken);
        if (vested <= schedule.claimed) return 0;

        return vested - schedule.claimed;
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

        emit TokensClaimed(agentToken, msg.sender, claimable, schedule.claimed);
    }

    /**
     * @notice Get vesting info
     * @param agentToken Agent token address
     */
    function getVestingInfo(address agentToken) external view returns (
        uint256 totalAmount,
        uint256 claimed,
        uint256 claimable,
        uint256 vested,
        uint256 cliffEndTime,
        uint256 vestEndTime,
        bool cliffPassed,
        bool fullyVested,
        address beneficiary
    ) {
        VestingSchedule memory schedule = schedules[agentToken];
        uint256 vestedAmount = calculateVested(agentToken);
        uint256 cliffEnd = schedule.startTime + CLIFF_DURATION;
        uint256 vestEnd = cliffEnd + VEST_DURATION;

        return (
            schedule.totalAmount,
            schedule.claimed,
            calculateClaimable(agentToken),
            vestedAmount,
            cliffEnd,
            vestEnd,
            block.timestamp >= cliffEnd,
            vestedAmount >= schedule.totalAmount,
            schedule.beneficiary
        );
    }

    /**
     * @notice Get time until next unlock
     * @param agentToken Agent token address
     * @return secondsUntilCliff Seconds until cliff ends (0 if passed)
     * @return secondsUntilFullVest Seconds until fully vested (0 if passed)
     */
    function getTimeRemaining(address agentToken) external view returns (
        uint256 secondsUntilCliff,
        uint256 secondsUntilFullVest
    ) {
        VestingSchedule memory schedule = schedules[agentToken];
        if (schedule.totalAmount == 0) return (0, 0);

        uint256 cliffEnd = schedule.startTime + CLIFF_DURATION;
        uint256 vestEnd = cliffEnd + VEST_DURATION;

        secondsUntilCliff = block.timestamp >= cliffEnd ? 0 : cliffEnd - block.timestamp;
        secondsUntilFullVest = block.timestamp >= vestEnd ? 0 : vestEnd - block.timestamp;
    }
}
