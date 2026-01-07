// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TeamMilestoneVesting
 * @notice Vests 250M team tokens based on FDV milestones
 * @dev Uses Chainlink oracle for price feed, with fallback for manual price
 *
 * V7 Milestone Schedule:
 * - $500K FDV  -> 50M tokens (20%)
 * - $1M FDV    -> 50M tokens (20%)
 * - $5M FDV    -> 50M tokens (20%)
 * - $10M FDV   -> 50M tokens (20%)
 * - $50M FDV   -> 50M tokens (20%)
 *
 * FDV = Token Price * 1B (total supply)
 */

interface AggregatorV3Interface {
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    );
    function decimals() external view returns (uint8);
}

contract TeamMilestoneVesting is Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18; // 1B tokens
    uint256 public constant TOTAL_ALLOCATION = 250_000_000e18; // 250M tokens
    uint256 public constant NUM_MILESTONES = 5;
    uint256 public constant TOKENS_PER_MILESTONE = 50_000_000e18; // 50M per milestone

    // FDV milestones in USD (with 8 decimals for Chainlink compatibility)
    uint256[5] public FDV_MILESTONES = [
        500_000e8,    // $500K
        1_000_000e8,  // $1M
        5_000_000e8,  // $5M
        10_000_000e8, // $10M
        50_000_000e8  // $50M
    ];

    struct VestingSchedule {
        uint256 totalAmount;
        uint256 claimed;
        uint256 milestonesAchieved;
        uint256 startTime;
        address beneficiary;
        address priceOracle; // Chainlink price feed for this token
    }

    // agentToken => VestingSchedule
    mapping(address => VestingSchedule) public schedules;

    // Fallback prices (used when oracle not available)
    mapping(address => uint256) public fallbackPrices; // Price in USD with 8 decimals

    event VestingSet(
        address indexed agentToken,
        address indexed beneficiary,
        uint256 amount,
        address priceOracle
    );

    event MilestoneAchieved(
        address indexed agentToken,
        uint256 milestone,
        uint256 fdv,
        uint256 tokensUnlocked
    );

    event TokensClaimed(
        address indexed agentToken,
        address indexed beneficiary,
        uint256 amount,
        uint256 milestonesAchieved
    );

    event FallbackPriceSet(
        address indexed agentToken,
        uint256 priceUsd
    );

    event OracleUpdated(
        address indexed agentToken,
        address indexed newOracle
    );

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @notice Set vesting schedule (called by GraduationManager at graduation)
     * @param agentToken Agent token address
     * @param beneficiary Team wallet (usually creator)
     * @param priceOracle Chainlink price feed address (can be zero for fallback mode)
     */
    function setVesting(
        address agentToken,
        address beneficiary,
        address priceOracle
    ) external onlyOwner {
        require(schedules[agentToken].totalAmount == 0, "Already set");
        require(beneficiary != address(0), "Invalid beneficiary");

        schedules[agentToken] = VestingSchedule({
            totalAmount: TOTAL_ALLOCATION,
            claimed: 0,
            milestonesAchieved: 0,
            startTime: block.timestamp,
            beneficiary: beneficiary,
            priceOracle: priceOracle
        });

        emit VestingSet(agentToken, beneficiary, TOTAL_ALLOCATION, priceOracle);
    }

    /**
     * @notice Update price oracle for a token
     * @param agentToken Agent token address
     * @param newOracle New Chainlink price feed address
     */
    function updateOracle(address agentToken, address newOracle) external onlyOwner {
        require(schedules[agentToken].totalAmount > 0, "Vesting not set");
        schedules[agentToken].priceOracle = newOracle;
        emit OracleUpdated(agentToken, newOracle);
    }

    /**
     * @notice Set fallback price (for when oracle not available)
     * @param agentToken Agent token address
     * @param priceUsd Price in USD with 8 decimals (e.g., 0.0001 USD = 10000)
     */
    function setFallbackPrice(address agentToken, uint256 priceUsd) external onlyOwner {
        fallbackPrices[agentToken] = priceUsd;
        emit FallbackPriceSet(agentToken, priceUsd);
    }

    /**
     * @notice Get current token price from oracle or fallback
     * @param agentToken Agent token address
     * @return priceUsd Price in USD with 8 decimals
     * @return fromOracle Whether price came from oracle
     */
    function getTokenPrice(address agentToken) public view returns (uint256 priceUsd, bool fromOracle) {
        VestingSchedule memory schedule = schedules[agentToken];

        if (schedule.priceOracle != address(0)) {
            try AggregatorV3Interface(schedule.priceOracle).latestRoundData() returns (
                uint80,
                int256 answer,
                uint256,
                uint256 updatedAt,
                uint80
            ) {
                // Check if price is recent (within 1 hour)
                if (answer > 0 && block.timestamp - updatedAt < 1 hours) {
                    return (uint256(answer), true);
                }
            } catch {
                // Oracle call failed, use fallback
            }
        }

        // Use fallback price
        return (fallbackPrices[agentToken], false);
    }

    /**
     * @notice Calculate current FDV
     * @param agentToken Agent token address
     * @return fdv FDV in USD with 8 decimals
     */
    function calculateFDV(address agentToken) public view returns (uint256 fdv) {
        (uint256 priceUsd,) = getTokenPrice(agentToken);
        if (priceUsd == 0) return 0;

        // FDV = price * total supply
        // price is in 8 decimals, supply is in 18 decimals
        // Result: FDV in 8 decimals
        fdv = (priceUsd * TOTAL_SUPPLY) / 1e18;
    }

    /**
     * @notice Calculate how many milestones have been achieved
     * @param agentToken Agent token address
     * @return achieved Number of milestones achieved (0-5)
     */
    function calculateMilestonesAchieved(address agentToken) public view returns (uint256 achieved) {
        uint256 fdv = calculateFDV(agentToken);
        if (fdv == 0) return 0;

        for (uint256 i = 0; i < NUM_MILESTONES; i++) {
            if (fdv >= FDV_MILESTONES[i]) {
                achieved = i + 1;
            } else {
                break;
            }
        }
    }

    /**
     * @notice Calculate claimable amount
     * @param agentToken Agent token address
     * @return Claimable amount
     */
    function calculateClaimable(address agentToken) public view returns (uint256) {
        VestingSchedule memory schedule = schedules[agentToken];
        if (schedule.totalAmount == 0) return 0;

        uint256 currentMilestones = calculateMilestonesAchieved(agentToken);
        uint256 totalVested = currentMilestones * TOKENS_PER_MILESTONE;

        if (totalVested <= schedule.claimed) return 0;
        return totalVested - schedule.claimed;
    }

    /**
     * @notice Claim vested tokens
     * @param agentToken Agent token address
     */
    function claim(address agentToken) external {
        VestingSchedule storage schedule = schedules[agentToken];
        require(msg.sender == schedule.beneficiary, "Not beneficiary");

        uint256 currentMilestones = calculateMilestonesAchieved(agentToken);
        uint256 claimable = calculateClaimable(agentToken);
        require(claimable > 0, "No tokens claimable");

        // Emit events for newly achieved milestones
        uint256 fdv = calculateFDV(agentToken);
        for (uint256 i = schedule.milestonesAchieved; i < currentMilestones; i++) {
            emit MilestoneAchieved(agentToken, i + 1, fdv, TOKENS_PER_MILESTONE);
        }

        schedule.claimed += claimable;
        schedule.milestonesAchieved = currentMilestones;

        IERC20(agentToken).safeTransfer(msg.sender, claimable);

        emit TokensClaimed(agentToken, msg.sender, claimable, currentMilestones);
    }

    /**
     * @notice Get vesting info
     * @param agentToken Agent token address
     */
    function getVestingInfo(address agentToken) external view returns (
        uint256 totalAmount,
        uint256 claimed,
        uint256 claimable,
        uint256 milestonesAchieved,
        uint256 currentFDV,
        uint256 nextMilestoneFDV,
        address beneficiary,
        address priceOracle
    ) {
        VestingSchedule memory schedule = schedules[agentToken];
        uint256 achieved = calculateMilestonesAchieved(agentToken);

        return (
            schedule.totalAmount,
            schedule.claimed,
            calculateClaimable(agentToken),
            achieved,
            calculateFDV(agentToken),
            achieved < NUM_MILESTONES ? FDV_MILESTONES[achieved] : 0,
            schedule.beneficiary,
            schedule.priceOracle
        );
    }
}
