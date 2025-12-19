// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentTokenV6
 * @notice Database mode ERC-20 - all tokens minted at graduation
 * @dev Uses Virtuals-style model: LP = 880M - 1.05X (where X = database shares)
 * 
 * Key Features:
 * - NO tokens minted at creation (database mode)
 * - ALL 1B tokens minted at graduation in one transaction
 * - Virtuals-style allocation: LP = 880M - 1.05X ensures healthy liquidity
 * - Safety check: LP minimum 565M tokens (56.5%)
 * - Only GraduationManager can mint
 * - One-time only (hasGraduated check)
 */
contract AgentTokenV6 is ERC20, Ownable {
    // ============ Token Supply & Distribution (Virtuals-style) ============
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000e18; // 1B tokens
    
    // Fixed Allocations (12% total)
    uint256 public constant VAULT_ALLOCATION = 20_000_000e18;  // 2% (20M)
    uint256 public constant TEAM_ALLOCATION = 100_000_000e18;  // 10% (100M)
    
    // Variable Allocations (88% total)
    // Formula: LP = 880M - 1.05X (where X = database shares held at graduation)
    uint256 public constant VARIABLE_POOL = 880_000_000e18;    // 88% (880M)
    uint256 public constant MIN_LP_TOKENS = 565_000_000e18;    // 56.5% (if X = 300M)
    
    address public immutable graduationManager;
    bool public hasGraduated;
    
    event Graduated(
        uint256 timestamp,
        uint256 holdersTotal,
        uint256 rewardsTotal,
        uint256 lpTotal
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
     * @dev Only callable by GraduationManager
     * 
     * Allocation model (Virtuals-style):
     * - Holders: X tokens (1:1 conversion from database shares)
     * - Rewards: 0.05X tokens (5% bonus, distributed proportionally)
     * - Team: 100M tokens (10%, fixed)
     * - Vault: 20M tokens (2%, fixed)
     * - LP: 880M - 1.05X tokens (remainder, ensures healthy liquidity)
     * 
     * @param holders Array of database holder addresses
     * @param holderAmounts Array of 1:1 token amounts (X)
     * @param rewardDistributor Address of RewardDistributor contract
     * @param totalRewards Total rewards to mint (0.05X)
     * @param teamVesting Address of TeamVesting contract
     * @param vault Address of vault
     * @param lpRecipient Address to receive LP tokens (GraduationManager)
     */
    function mintAtGraduation(
        address[] calldata holders,
        uint256[] calldata holderAmounts,
        address rewardDistributor,
        uint256 totalRewards,
        address teamVesting,
        address vault,
        address lpRecipient
    ) external onlyOwner {
        require(msg.sender == graduationManager, "Only graduation manager");
        require(!hasGraduated, "Already graduated");
        require(holders.length == holderAmounts.length, "Length mismatch");
        
        hasGraduated = true;
        
        // 1. Mint 1:1 conversions to database holders
        uint256 totalHolderTokens = 0;
        for (uint256 i = 0; i < holders.length; i++) {
            if (holderAmounts[i] > 0) {
                _mint(holders[i], holderAmounts[i]);
                totalHolderTokens += holderAmounts[i];
            }
        }
        
        // 2. Mint rewards to RewardDistributor (5% of holdings)
        if (totalRewards > 0) {
            _mint(rewardDistributor, totalRewards);
        }
        
        // 3. Mint team allocation to TeamVesting
        _mint(teamVesting, TEAM_ALLOCATION);
        
        // 4. Mint vault allocation
        _mint(vault, VAULT_ALLOCATION);
        
        // 5. Calculate and mint LP allocation
        // Formula: LP = 880M - 1.05X (where X = totalHolderTokens)
        uint256 holdersPlusRewards = totalHolderTokens + totalRewards;
        uint256 lpTokens = VARIABLE_POOL - holdersPlusRewards;
        
        // Safety check: Ensure LP gets at least minimum allocation
        require(lpTokens >= MIN_LP_TOKENS, "LP allocation too low");
        
        _mint(lpRecipient, lpTokens);
        
        // Verify total supply
        require(totalSupply() == TOTAL_SUPPLY, "Supply mismatch");
        
        emit Graduated(
            block.timestamp,
            totalHolderTokens,
            totalRewards,
            lpTokens
        );
    }
    
    /**
     * @notice Check if token has graduated
     */
    function isGraduated() external view returns (bool) {
        return hasGraduated;
    }
}
