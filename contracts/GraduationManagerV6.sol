// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentTokenV6.sol";
import "./RewardDistributor.sol";
import "./TeamVesting.sol";
import "./LPLocker.sol";

interface IUniswapV2Factory {
    function createPair(address tokenA, address tokenB) external returns (address pair);
    function getPair(address tokenA, address tokenB) external view returns (address pair);
}

interface IUniswapV2Router02 {
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);
}

/**
 * @title GraduationManagerV6
 * @notice Handles graduation with Virtuals-style variable LP allocation
 * @dev Formula: LP = 880M - 1.05X (where X = database shares held)
 * 
 * Key Features:
 * - Mints all 1B tokens using Virtuals-style formula
 * - Creates Uniswap V2 LP with 42K PROMPT + remainder tokens
 * - Locks 95% LP for 3 years, 5% to vault
 * - Sets holder rewards (RewardDistributor)
 * - Sets team vesting (TeamVesting)
 * - One-time only per agent
 * - Only callable by backend (owner)
 */
contract GraduationManagerV6 is Ownable {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable promptToken;
    address public immutable vault;
    IUniswapV2Factory public immutable uniswapFactory;
    IUniswapV2Router02 public immutable uniswapRouter;
    RewardDistributor public immutable rewardDistributor;
    TeamVesting public immutable teamVesting;
    LPLocker public immutable lpLocker;
    
    uint256 public constant LOCK_DURATION = 3 * 365 days;  // 3 years
    uint256 public constant LP_LOCK_BPS = 9500;             // 95%
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant TEAM_ALLOCATION = 100_000_000e18; // 100M
    uint256 public constant GRADUATION_THRESHOLD = 42_000e18; // 42K PROMPT
    
    struct GraduationInfo {
        address lpPair;
        uint256 totalLpTokens;
        uint256 lpLocked;
        uint256 lpToVault;
        uint256 lockId;
        uint256 timestamp;
    }
    
    mapping(address => GraduationInfo) public graduations;
    
    event GraduationExecuted(
        address indexed agentToken,
        address lpPair,
        uint256 holdersTotal,
        uint256 rewardsTotal,
        uint256 lpTokens,
        uint256 lpLocked,
        uint256 lockId
    );
    
    constructor(
        address _promptToken,
        address _vault,
        address _uniswapFactory,
        address _uniswapRouter,
        address _rewardDistributor,
        address _teamVesting,
        address _lpLocker,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_promptToken != address(0), "Invalid PROMPT");
        require(_vault != address(0), "Invalid vault");
        require(_uniswapFactory != address(0), "Invalid factory");
        require(_uniswapRouter != address(0), "Invalid router");
        require(_rewardDistributor != address(0), "Invalid distributor");
        require(_teamVesting != address(0), "Invalid vesting");
        require(_lpLocker != address(0), "Invalid locker");
        
        promptToken = IERC20(_promptToken);
        vault = _vault;
        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        rewardDistributor = RewardDistributor(_rewardDistributor);
        teamVesting = TeamVesting(_teamVesting);
        lpLocker = LPLocker(_lpLocker);
    }
    
    /**
     * @notice Execute graduation with Virtuals-style allocation
     * @dev Mints all tokens, creates LP, locks 95% for 3 years
     * 
     * @param agentToken The agent token address
     * @param holders Array of database holder addresses
     * @param holderAmounts Array of 1:1 token amounts (X)
     * @param rewardRecipients Array of reward recipient addresses
     * @param rewardAmounts Array of reward amounts (5% of holdings)
     * @param creator Creator address (team vesting beneficiary)
     * @return lockId ID of the LP lock
     */
    function executeGraduation(
        address agentToken,
        address[] calldata holders,
        uint256[] calldata holderAmounts,
        address[] calldata rewardRecipients,
        uint256[] calldata rewardAmounts,
        address creator
    ) external onlyOwner returns (uint256 lockId) {
        require(graduations[agentToken].lpPair == address(0), "Already graduated");
        require(holders.length == holderAmounts.length, "Holder length mismatch");
        require(rewardRecipients.length == rewardAmounts.length, "Reward length mismatch");
        
        // 1. Calculate totals
        uint256 totalRewards = 0;
        for (uint256 i = 0; i < rewardAmounts.length; i++) {
            totalRewards += rewardAmounts[i];
        }
        
        // 2. Mint all tokens via AgentTokenV6
        AgentTokenV6(agentToken).mintAtGraduation(
            holders,
            holderAmounts,
            address(rewardDistributor),
            totalRewards,
            address(teamVesting),
            vault,
            address(this) // LP recipient
        );
        
        // 3. Set rewards in RewardDistributor
        rewardDistributor.setRewards(agentToken, rewardRecipients, rewardAmounts);
        
        // 4. Set team vesting
        teamVesting.setVesting(agentToken, creator, TEAM_ALLOCATION);
        
        // 5. Pull 42K PROMPT from vault
        promptToken.safeTransferFrom(vault, address(this), GRADUATION_THRESHOLD);
        
        // 6. Create or get Uniswap V2 pair
        address pair = uniswapFactory.getPair(agentToken, address(promptToken));
        if (pair == address(0)) {
            pair = uniswapFactory.createPair(agentToken, address(promptToken));
        }
        
        // 7. Approve router (using forceApprove for OZ v5 compatibility)
        uint256 lpTokenBalance = IERC20(agentToken).balanceOf(address(this));
        IERC20(agentToken).forceApprove(address(uniswapRouter), lpTokenBalance);
        promptToken.forceApprove(address(uniswapRouter), GRADUATION_THRESHOLD);
        
        // 8. Add liquidity with 0.5% slippage tolerance
        uint256 minTokens = (lpTokenBalance * 995) / 1000; // 99.5%
        uint256 minPrompt = (GRADUATION_THRESHOLD * 995) / 1000; // 99.5%
        
        (,, uint256 totalLpTokens) = uniswapRouter.addLiquidity(
            agentToken,
            address(promptToken),
            lpTokenBalance,
            GRADUATION_THRESHOLD,
            minTokens,      // 0.5% slippage allowed
            minPrompt,      // 0.5% slippage allowed
            address(this),
            block.timestamp + 300
        );
        
        require(totalLpTokens > 0, "No LP tokens received");
        
        // 9. Calculate 95/5 split
        uint256 lpToLock = (totalLpTokens * LP_LOCK_BPS) / BASIS_POINTS;
        uint256 lpToVault = totalLpTokens - lpToLock;
        
        // 10. Approve locker (using forceApprove for OZ v5 compatibility)
        IERC20(pair).forceApprove(address(lpLocker), lpToLock);
        
        // 11. Lock 95% for 3 years (vault is beneficiary)
        lockId = lpLocker.lock(
            pair,
            lpToLock,
            block.timestamp + LOCK_DURATION,
            vault
        );
        
        // 12. Send 5% to vault immediately
        IERC20(pair).safeTransfer(vault, lpToVault);
        
        // 13. Store graduation info
        graduations[agentToken] = GraduationInfo({
            lpPair: pair,
            totalLpTokens: totalLpTokens,
            lpLocked: lpToLock,
            lpToVault: lpToVault,
            lockId: lockId,
            timestamp: block.timestamp
        });
        
        uint256 totalHolderTokens = 0;
        for (uint256 i = 0; i < holderAmounts.length; i++) {
            totalHolderTokens += holderAmounts[i];
        }
        
        emit GraduationExecuted(
            agentToken,
            pair,
            totalHolderTokens,
            totalRewards,
            lpTokenBalance,
            lpToLock,
            lockId
        );
        
        return lockId;
    }
    
    /**
     * @notice Get graduation info for an agent
     * @param agentToken Agent token address
     * @return info GraduationInfo struct
     */
    function getGraduationInfo(address agentToken) external view returns (GraduationInfo memory info) {
        return graduations[agentToken];
    }
    
    /**
     * @notice Check if agent has graduated
     * @param agentToken Agent token address
     * @return True if graduated
     */
    function isGraduated(address agentToken) external view returns (bool) {
        return graduations[agentToken].lpPair != address(0);
    }
}
