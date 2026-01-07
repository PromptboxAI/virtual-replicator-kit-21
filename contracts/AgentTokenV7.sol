// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentTokenV7
 * @notice Database mode ERC-20 - all tokens minted at graduation
 * @dev V7 uses fixed allocations for price continuity
 *
 * V7 Key Changes from V6:
 * - Fixed LP allocation: 140M (not variable "880M - 1.05X")
 * - Team allocation: 450M (250M milestone + 200M time vested)
 * - Ecosystem rewards: 50M for PROMPT holders
 * - Variable pool: 360M (holders + rewards + vault remainder)
 *
 * Total Supply Breakdown (1B):
 * - Fixed (640M = 64%):
 *   - LP: 140M (14%)
 *   - Team Milestone: 250M (25%)
 *   - Team Time: 200M (20%)
 *   - Ecosystem: 50M (5%)
 * - Variable (360M = 36%):
 *   - Holders: X (1:1 from database)
 *   - Rewards: 0.05X (5% of holdings)
 *   - Vault: 360M - X - 0.05X (remainder)
 */
contract AgentTokenV7 is ERC20, Ownable {
    // ============ Total Supply ============
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18; // 1B tokens

    // ============ Fixed Allocations (640M = 64%) ============
    uint256 public constant LP_ALLOCATION = 140_000_000e18;           // 14% - Fixed for price continuity
    uint256 public constant TEAM_MILESTONE_ALLOCATION = 250_000_000e18; // 25% - FDV milestones
    uint256 public constant TEAM_TIME_ALLOCATION = 200_000_000e18;    // 20% - 1yr cliff + 6mo vest
    uint256 public constant ECOSYSTEM_ALLOCATION = 50_000_000e18;     // 5% - PROMPT holders

    // ============ Variable Pool (360M = 36%) ============
    uint256 public constant VARIABLE_POOL = 360_000_000e18;           // Holders + Rewards + Vault
    uint256 public constant TRADEABLE_CAP = 248_000_000e18;           // Max shares on curve

    address public immutable graduationManager;
    bool public hasGraduated;

    event Graduated(
        uint256 timestamp,
        uint256 holdersTotal,
        uint256 rewardsTotal,
        uint256 lpTotal,
        uint256 vaultTotal
    );

    constructor(
        string memory name,
        string memory symbol,
        address _graduationManager,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        require(_graduationManager != address(0), "Invalid manager");
        graduationManager = _graduationManager;
    }

    /**
     * @notice Mint all tokens at graduation (one-time only)
     * @dev Only callable by GraduationManager (owner)
     *
     * V7 Allocation:
     * - Holders: X tokens (1:1 conversion from database shares)
     * - Rewards: 0.05X tokens (5% bonus to RewardDistributor)
     * - Team Milestone: 250M tokens (FDV-based vesting)
     * - Team Time: 200M tokens (1yr cliff + 6mo vest)
     * - Ecosystem: 50M tokens (for PROMPT holders)
     * - LP: 140M tokens (fixed for price continuity)
     * - Vault: 360M - X - 0.05X tokens (remainder of variable pool)
     *
     * @param holders Array of database holder addresses
     * @param holderAmounts Array of 1:1 token amounts (X)
     * @param rewardDistributor Address of RewardDistributor contract
     * @param totalRewards Total rewards to mint (0.05X)
     * @param teamMilestoneVesting Address of TeamMilestoneVesting contract
     * @param teamTimeVesting Address of TeamTimeVesting contract
     * @param ecosystemRewards Address of EcosystemRewards contract
     * @param vault Address of vault
     * @param lpRecipient Address to receive LP tokens (GraduationManager)
     */
    function mintAtGraduation(
        address[] calldata holders,
        uint256[] calldata holderAmounts,
        address rewardDistributor,
        uint256 totalRewards,
        address teamMilestoneVesting,
        address teamTimeVesting,
        address ecosystemRewards,
        address vault,
        address lpRecipient
    ) external onlyOwner {
        require(!hasGraduated, "Already graduated");
        require(holders.length == holderAmounts.length, "Length mismatch");

        hasGraduated = true;

        // ============ FIXED ALLOCATIONS (640M) ============

        // 1. Mint LP allocation (140M - fixed for price continuity)
        _mint(lpRecipient, LP_ALLOCATION);

        // 2. Mint Team Milestone allocation (250M)
        _mint(teamMilestoneVesting, TEAM_MILESTONE_ALLOCATION);

        // 3. Mint Team Time allocation (200M)
        _mint(teamTimeVesting, TEAM_TIME_ALLOCATION);

        // 4. Mint Ecosystem allocation (50M for PROMPT holders)
        _mint(ecosystemRewards, ECOSYSTEM_ALLOCATION);

        // ============ VARIABLE ALLOCATIONS (360M) ============

        // 5. Mint 1:1 conversions to database holders
        uint256 totalHolderTokens = 0;
        for (uint256 i = 0; i < holders.length; i++) {
            if (holderAmounts[i] > 0) {
                _mint(holders[i], holderAmounts[i]);
                totalHolderTokens += holderAmounts[i];
            }
        }

        // 6. Mint rewards to RewardDistributor (5% of holdings)
        if (totalRewards > 0) {
            _mint(rewardDistributor, totalRewards);
        }

        // 7. Calculate and mint vault allocation (remainder)
        uint256 holdersPlusRewards = totalHolderTokens + totalRewards;
        require(holdersPlusRewards <= VARIABLE_POOL, "Variable pool exceeded");
        uint256 vaultTokens = VARIABLE_POOL - holdersPlusRewards;
        _mint(vault, vaultTokens);

        // Verify total supply
        require(totalSupply() == TOTAL_SUPPLY, "Supply mismatch");

        emit Graduated(
            block.timestamp,
            totalHolderTokens,
            totalRewards,
            LP_ALLOCATION,
            vaultTokens
        );
    }

    /**
     * @notice Check if token has graduated
     */
    function isGraduated() external view returns (bool) {
        return hasGraduated;
    }
}
