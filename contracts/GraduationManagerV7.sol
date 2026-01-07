// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentTokenV7.sol";
import "./RewardDistributor.sol";
import "./TeamMilestoneVesting.sol";
import "./TeamTimeVesting.sol";
import "./EcosystemRewards.sol";
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
 * @title GraduationManagerV7
 * @notice Handles graduation with V7 fixed LP allocation for price continuity
 *
 * V7 Key Changes from V6:
 * - Fixed LP allocation: 140M tokens (not variable "880M - 1.05X")
 * - Graduation threshold: 42,160 PROMPT (not 42,000)
 * - Team allocation: 250M milestone + 200M time vested (not 100M cliff)
 * - Ecosystem rewards: 50M for PROMPT holders (new)
 * - Price continuity: DEX opens at exactly P1 (0.0003 PROMPT/token)
 *
 * Token Distribution (1B):
 * - Fixed (640M): LP(140M) + TeamMilestone(250M) + TeamTime(200M) + Ecosystem(50M)
 * - Variable (360M): Holders(X) + Rewards(0.05X) + Vault(remainder)
 */
contract GraduationManagerV7 is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable promptToken;
    address public immutable vault;
    IUniswapV2Factory public immutable uniswapFactory;
    IUniswapV2Router02 public immutable uniswapRouter;
    RewardDistributor public immutable rewardDistributor;
    TeamMilestoneVesting public immutable teamMilestoneVesting;
    TeamTimeVesting public immutable teamTimeVesting;
    EcosystemRewards public immutable ecosystemRewards;
    LPLocker public immutable lpLocker;

    // V7 Constants
    uint256 public constant LOCK_DURATION = 3 * 365 days;       // 3 years LP lock
    uint256 public constant LP_LOCK_BPS = 9500;                  // 95% locked
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant LP_ALLOCATION = 140_000_000e18;      // Fixed 140M LP
    uint256 public constant GRADUATION_THRESHOLD = 42_160e18;    // 42,160 PROMPT

    struct GraduationInfo {
        address lpPair;
        uint256 totalLpTokens;
        uint256 lpLocked;
        uint256 lpToVault;
        uint256 lockId;
        uint256 timestamp;
        uint256 promptRaised;
        uint256 holdersCount;
    }

    mapping(address => GraduationInfo) public graduations;

    event GraduationExecuted(
        address indexed agentToken,
        address lpPair,
        uint256 holdersTotal,
        uint256 rewardsTotal,
        uint256 lpTokens,
        uint256 lpLocked,
        uint256 lockId,
        uint256 promptRaised
    );

    constructor(
        address _promptToken,
        address _vault,
        address _uniswapFactory,
        address _uniswapRouter,
        address _rewardDistributor,
        address _teamMilestoneVesting,
        address _teamTimeVesting,
        address _ecosystemRewards,
        address _lpLocker,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_promptToken != address(0), "Invalid PROMPT");
        require(_vault != address(0), "Invalid vault");
        require(_uniswapFactory != address(0), "Invalid factory");
        require(_uniswapRouter != address(0), "Invalid router");
        require(_rewardDistributor != address(0), "Invalid distributor");
        require(_teamMilestoneVesting != address(0), "Invalid milestone vesting");
        require(_teamTimeVesting != address(0), "Invalid time vesting");
        require(_ecosystemRewards != address(0), "Invalid ecosystem");
        require(_lpLocker != address(0), "Invalid locker");

        promptToken = IERC20(_promptToken);
        vault = _vault;
        uniswapFactory = IUniswapV2Factory(_uniswapFactory);
        uniswapRouter = IUniswapV2Router02(_uniswapRouter);
        rewardDistributor = RewardDistributor(_rewardDistributor);
        teamMilestoneVesting = TeamMilestoneVesting(_teamMilestoneVesting);
        teamTimeVesting = TeamTimeVesting(_teamTimeVesting);
        ecosystemRewards = EcosystemRewards(_ecosystemRewards);
        lpLocker = LPLocker(_lpLocker);
    }

    /**
     * @notice Execute graduation with V7 fixed LP allocation
     *
     * @param agentToken The agent token address
     * @param holders Array of database holder addresses
     * @param holderAmounts Array of 1:1 token amounts (X)
     * @param rewardRecipients Array of reward recipient addresses
     * @param rewardAmounts Array of reward amounts (5% of holdings)
     * @param ecosystemHolders Array of PROMPT holder addresses (for ecosystem rewards)
     * @param ecosystemAmounts Array of ecosystem reward amounts
     * @param totalPromptSnapshot Total PROMPT supply at snapshot
     * @param creator Creator address (team vesting beneficiary)
     * @param priceOracle Chainlink price oracle for milestone vesting (can be zero)
     * @return lockId ID of the LP lock
     */
    function executeGraduation(
        address agentToken,
        address[] calldata holders,
        uint256[] calldata holderAmounts,
        address[] calldata rewardRecipients,
        uint256[] calldata rewardAmounts,
        address[] calldata ecosystemHolders,
        uint256[] calldata ecosystemAmounts,
        uint256 totalPromptSnapshot,
        address creator,
        address priceOracle
    ) external onlyOwner returns (uint256 lockId) {
        require(graduations[agentToken].lpPair == address(0), "Already graduated");
        require(holders.length == holderAmounts.length, "Holder length mismatch");
        require(rewardRecipients.length == rewardAmounts.length, "Reward length mismatch");
        require(ecosystemHolders.length == ecosystemAmounts.length, "Ecosystem length mismatch");

        // 1. Calculate totals
        uint256 totalRewards = 0;
        for (uint256 i = 0; i < rewardAmounts.length; i++) {
            totalRewards += rewardAmounts[i];
        }

        // 2. Mint all tokens via AgentTokenV7
        AgentTokenV7(agentToken).mintAtGraduation(
            holders,
            holderAmounts,
            address(rewardDistributor),
            totalRewards,
            address(teamMilestoneVesting),
            address(teamTimeVesting),
            address(ecosystemRewards),
            vault,
            address(this) // LP recipient
        );

        // 3. Set holder rewards in RewardDistributor
        rewardDistributor.setRewards(agentToken, rewardRecipients, rewardAmounts);

        // 4. Set team milestone vesting (250M)
        teamMilestoneVesting.setVesting(agentToken, creator, priceOracle);

        // 5. Set team time vesting (200M)
        teamTimeVesting.setVesting(agentToken, creator);

        // 6. Set ecosystem rewards (50M for PROMPT holders)
        ecosystemRewards.setRewards(
            agentToken,
            ecosystemHolders,
            ecosystemAmounts,
            totalPromptSnapshot
        );

        // 7. Pull PROMPT from vault (graduation threshold)
        promptToken.safeTransferFrom(vault, address(this), GRADUATION_THRESHOLD);

        // 8. Create or get Uniswap V2 pair
        address pair = uniswapFactory.getPair(agentToken, address(promptToken));
        if (pair == address(0)) {
            pair = uniswapFactory.createPair(agentToken, address(promptToken));
        }

        // 9. Approve router
        // V7: Fixed LP allocation of 140M
        uint256 lpTokenBalance = IERC20(agentToken).balanceOf(address(this));
        require(lpTokenBalance == LP_ALLOCATION, "LP allocation mismatch");

        IERC20(agentToken).forceApprove(address(uniswapRouter), lpTokenBalance);
        promptToken.forceApprove(address(uniswapRouter), GRADUATION_THRESHOLD);

        // 10. Add liquidity with 0.5% slippage tolerance
        uint256 minTokens = (lpTokenBalance * 995) / 1000;
        uint256 minPrompt = (GRADUATION_THRESHOLD * 995) / 1000;

        (,, uint256 totalLpTokens) = uniswapRouter.addLiquidity(
            agentToken,
            address(promptToken),
            lpTokenBalance,      // 140M tokens
            GRADUATION_THRESHOLD, // 42,160 PROMPT
            minTokens,
            minPrompt,
            address(this),
            block.timestamp + 300
        );

        require(totalLpTokens > 0, "No LP tokens received");

        // 11. Calculate 95/5 split
        uint256 lpToLock = (totalLpTokens * LP_LOCK_BPS) / BASIS_POINTS;
        uint256 lpToVault = totalLpTokens - lpToLock;

        // 12. Approve locker
        IERC20(pair).forceApprove(address(lpLocker), lpToLock);

        // 13. Lock 95% for 3 years
        lockId = lpLocker.lock(
            pair,
            lpToLock,
            block.timestamp + LOCK_DURATION,
            vault
        );

        // 14. Send 5% to vault immediately
        IERC20(pair).safeTransfer(vault, lpToVault);

        // 15. Store graduation info
        uint256 totalHolderTokens = 0;
        for (uint256 i = 0; i < holderAmounts.length; i++) {
            totalHolderTokens += holderAmounts[i];
        }

        graduations[agentToken] = GraduationInfo({
            lpPair: pair,
            totalLpTokens: totalLpTokens,
            lpLocked: lpToLock,
            lpToVault: lpToVault,
            lockId: lockId,
            timestamp: block.timestamp,
            promptRaised: GRADUATION_THRESHOLD / 1e18,
            holdersCount: holders.length
        });

        emit GraduationExecuted(
            agentToken,
            pair,
            totalHolderTokens,
            totalRewards,
            lpTokenBalance,
            lpToLock,
            lockId,
            GRADUATION_THRESHOLD
        );

        return lockId;
    }

    /**
     * @notice Get graduation info for an agent
     */
    function getGraduationInfo(address agentToken) external view returns (GraduationInfo memory info) {
        return graduations[agentToken];
    }

    /**
     * @notice Check if agent has graduated
     */
    function isGraduated(address agentToken) external view returns (bool) {
        return graduations[agentToken].lpPair != address(0);
    }

    /**
     * @notice Get V7 constants
     */
    function getV7Constants() external pure returns (
        uint256 lpAllocation,
        uint256 graduationThreshold,
        uint256 lockDuration,
        uint256 lpLockBps
    ) {
        return (LP_ALLOCATION, GRADUATION_THRESHOLD, LOCK_DURATION, LP_LOCK_BPS);
    }
}
