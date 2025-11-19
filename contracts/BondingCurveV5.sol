// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IAgentTokenV5 {
    function mint(address to, uint256 amount) external;
    function burn(address from, uint256 amount) external;
    function totalSupply() external view returns (uint256);
}

/**
 * @title BondingCurveV5
 * @notice Central contract managing all agent tokens with linear bonding curve
 * @dev PROMPT-native, reserve-based graduation, two-way trading, admin-configurable fees
 */
contract BondingCurveV5 is ReentrancyGuard, Ownable {
    // Constants
    uint256 public constant GRADUATION_SUPPLY = 1_000_000 * 10**18; // 1M tokens
    uint256 public constant BASIS_POINTS = 10000;
    
    // Admin-configurable fee parameters
    uint256 public buyFeeBps = 500; // 5% default
    uint256 public sellFeeBps = 500; // 5% default
    
    // Admin-configurable fee distribution (must sum to BASIS_POINTS)
    uint256 public creatorFeeBps = 4000; // 40% default
    uint256 public platformFeeBps = 4000; // 40% default
    uint256 public lpFeeBps = 2000; // 20% default
    
    // Admin-configurable default graduation threshold
    uint256 public defaultGraduationThreshold = 42000 * 10**18; // 42,000 PROMPT
    
    IERC20 public immutable promptToken;
    address public platformVault;
    address public treasury;
    
    enum AgentPhase { Active, Graduated }
    
    struct AgentConfig {
        uint256 p0; // Starting price in PROMPT (with 18 decimals)
        uint256 p1; // Ending price in PROMPT (with 18 decimals)
        uint256 graduationThresholdPrompt; // PROMPT reserves needed to graduate
        address creator;
        address agentToken;
    }
    
    struct AgentState {
        uint256 tokensSold; // Total tokens sold through bonding curve
        uint256 promptReserves; // PROMPT held in bonding curve
        AgentPhase phase;
    }
    
    // Agent ID => Config
    mapping(bytes32 => AgentConfig) public agentConfigs;
    // Agent ID => State
    mapping(bytes32 => AgentState) public agentStates;
    
    // Events
    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed agentToken,
        address indexed creator,
        uint256 p0,
        uint256 p1,
        uint256 graduationThreshold
    );
    
    event TradeExecuted(
        bytes32 indexed agentId,
        address indexed trader,
        bool isBuy,
        uint256 promptAmount,
        uint256 tokenAmount,
        uint256 newPrice,
        uint256 newSupply,
        uint256 timestamp
    );
    
    event Graduated(
        bytes32 indexed agentId,
        uint256 finalSupply,
        uint256 finalReserves,
        uint256 timestamp
    );
    
    event FeesUpdated(uint256 buyFeeBps, uint256 sellFeeBps);
    event FeeDistributionUpdated(uint256 creatorFeeBps, uint256 platformFeeBps, uint256 lpFeeBps);
    event DefaultGraduationThresholdUpdated(uint256 newThreshold);
    event PlatformVaultUpdated(address newVault);
    event TreasuryUpdated(address newTreasury);
    
    constructor(
        address _promptToken,
        address _platformVault,
        address _treasury,
        address initialOwner
    ) Ownable(initialOwner) {
        require(_promptToken != address(0), "Invalid PROMPT token");
        require(_platformVault != address(0), "Invalid platform vault");
        require(_treasury != address(0), "Invalid treasury");
        
        promptToken = IERC20(_promptToken);
        platformVault = _platformVault;
        treasury = _treasury;
    }
    
    /**
     * @notice Register a new agent with the bonding curve
     * @param agentId Unique identifier for the agent
     * @param agentToken Address of the agent's ERC20 token
     * @param creator Address of the agent creator
     * @param p0 Starting price in PROMPT (18 decimals)
     * @param p1 Ending price at graduation (18 decimals)
     * @param graduationThresholdPrompt PROMPT reserves needed to graduate
     */
    function registerAgent(
        bytes32 agentId,
        address agentToken,
        address creator,
        uint256 p0,
        uint256 p1,
        uint256 graduationThresholdPrompt
    ) external onlyOwner {
        require(agentConfigs[agentId].agentToken == address(0), "Agent already registered");
        require(agentToken != address(0), "Invalid agent token");
        require(creator != address(0), "Invalid creator");
        require(p1 > p0, "p1 must be greater than p0");
        
        agentConfigs[agentId] = AgentConfig({
            p0: p0,
            p1: p1,
            graduationThresholdPrompt: graduationThresholdPrompt,
            creator: creator,
            agentToken: agentToken
        });
        
        agentStates[agentId] = AgentState({
            tokensSold: 0,
            promptReserves: 0,
            phase: AgentPhase.Active
        });
        
        emit AgentRegistered(agentId, agentToken, creator, p0, p1, graduationThresholdPrompt);
    }
    
    /**
     * @notice Buy agent tokens with PROMPT
     * @param agentId Unique identifier for the agent
     * @param promptIn Amount of PROMPT to spend
     * @param minTokensOut Minimum tokens expected (slippage protection)
     */
    function buy(
        bytes32 agentId,
        uint256 promptIn,
        uint256 minTokensOut
    ) external nonReentrant returns (uint256 tokensOut) {
        AgentConfig memory config = agentConfigs[agentId];
        AgentState storage state = agentStates[agentId];
        
        require(config.agentToken != address(0), "Agent not registered");
        require(state.phase == AgentPhase.Active, "Agent graduated");
        require(promptIn > 0, "Invalid PROMPT amount");
        
        // Calculate fee
        uint256 fee = (promptIn * buyFeeBps) / BASIS_POINTS;
        uint256 promptAfterFee = promptIn - fee;
        
        // Calculate tokens to mint
        tokensOut = _calculateBuyReturn(agentId, promptAfterFee);
        require(tokensOut >= minTokensOut, "Slippage exceeded");
        require(state.tokensSold + tokensOut <= GRADUATION_SUPPLY, "Exceeds graduation supply");
        
        // Transfer PROMPT from buyer
        require(promptToken.transferFrom(msg.sender, address(this), promptIn), "PROMPT transfer failed");
        
        // Distribute fees
        _distributeBuyFees(config.creator, fee);
        
        // Update state
        state.tokensSold += tokensOut;
        state.promptReserves += promptAfterFee;
        
        // Mint tokens to buyer
        IAgentTokenV5(config.agentToken).mint(msg.sender, tokensOut);
        
        // Check for graduation
        if (_canGraduate(agentId)) {
            _graduate(agentId);
        }
        
        emit TradeExecuted(
            agentId,
            msg.sender,
            true,
            promptIn,
            tokensOut,
            getCurrentPrice(agentId),
            state.tokensSold,
            block.timestamp
        );
        
        return tokensOut;
    }
    
    /**
     * @notice Sell agent tokens for PROMPT
     * @param agentId Unique identifier for the agent
     * @param tokensIn Amount of tokens to sell
     * @param minPromptOut Minimum PROMPT expected (slippage protection)
     */
    function sell(
        bytes32 agentId,
        uint256 tokensIn,
        uint256 minPromptOut
    ) external nonReentrant returns (uint256 promptOut) {
        AgentConfig memory config = agentConfigs[agentId];
        AgentState storage state = agentStates[agentId];
        
        require(config.agentToken != address(0), "Agent not registered");
        require(state.phase == AgentPhase.Active, "Agent graduated");
        require(tokensIn > 0, "Invalid token amount");
        require(tokensIn <= state.tokensSold, "Exceeds sold supply");
        
        // Calculate PROMPT to return (GROSS amount before fees)
        uint256 promptGross = _calculateSellReturn(agentId, tokensIn);
        
        // Apply sell fee
        uint256 fee = (promptGross * sellFeeBps) / BASIS_POINTS;
        promptOut = promptGross - fee;
        
        require(promptOut >= minPromptOut, "Slippage exceeded");
        require(promptGross <= state.promptReserves, "Insufficient reserves");
        
        // Burn tokens from seller
        IAgentTokenV5(config.agentToken).burn(msg.sender, tokensIn);
        
        // Update state (reserve decrements by GROSS amount)
        state.tokensSold -= tokensIn;
        state.promptReserves -= promptGross;
        
        // Distribute sell fees
        if (fee > 0) {
            _distributeSellFees(config.creator, fee);
        }
        
        // Transfer net PROMPT to seller
        require(promptToken.transfer(msg.sender, promptOut), "PROMPT transfer failed");
        
        emit TradeExecuted(
            agentId,
            msg.sender,
            false,
            promptOut,
            tokensIn,
            getCurrentPrice(agentId),
            state.tokensSold,
            block.timestamp
        );
        
        return promptOut;
    }
    
    /**
     * @notice Get current price for an agent
     * @param agentId Unique identifier for the agent
     * @return Current price in PROMPT (18 decimals)
     */
    function getCurrentPrice(bytes32 agentId) public view returns (uint256) {
        AgentConfig memory config = agentConfigs[agentId];
        AgentState memory state = agentStates[agentId];
        
        if (config.agentToken == address(0)) return 0;
        
        // Linear interpolation: price = p0 + (p1 - p0) * (supply / GRADUATION_SUPPLY)
        uint256 priceRange = config.p1 - config.p0;
        uint256 price = config.p0 + (priceRange * state.tokensSold) / GRADUATION_SUPPLY;
        
        return price;
    }
    
    /**
     * @notice Calculate tokens received for a given PROMPT amount
     * @param agentId Unique identifier for the agent
     * @param promptIn Amount of PROMPT to spend (after fees)
     * @return tokensOut Amount of tokens to receive
     */
    function _calculateBuyReturn(bytes32 agentId, uint256 promptIn) internal view returns (uint256) {
        AgentConfig memory config = agentConfigs[agentId];
        AgentState memory state = agentStates[agentId];
        
        uint256 priceAtStart = getCurrentPrice(agentId);
        
        // For linear curve: price(s) = p0 + slope * s, where slope = (p1 - p0) / GRADUATION_SUPPLY
        // Integral: promptIn = p0 * tokens + 0.5 * slope * tokens^2
        // Solving quadratic: tokens = (sqrt(p0^2 + 2*slope*promptIn) - p0) / slope
        
        uint256 slope = ((config.p1 - config.p0) * 10**18) / GRADUATION_SUPPLY;
        uint256 a = slope / 2;
        uint256 b = priceAtStart;
        uint256 c = promptIn;
        
        // Discriminant: b^2 + 4*a*c (we use 2*a*c since a is already halved)
        uint256 discriminant = (b * b) / 10**18 + (2 * a * c) / 10**18;
        uint256 sqrtDiscriminant = sqrt(discriminant * 10**18);
        
        // tokens = (sqrt(discriminant) - b) / (2*a) = (sqrt(discriminant) - b) / slope
        uint256 tokensOut = ((sqrtDiscriminant - b) * GRADUATION_SUPPLY) / (config.p1 - config.p0);
        
        return tokensOut;
    }
    
    /**
     * @notice Calculate PROMPT received for selling tokens
     * @param agentId Unique identifier for the agent
     * @param tokensIn Amount of tokens to sell
     * @return promptOut Amount of PROMPT to receive
     */
    function _calculateSellReturn(bytes32 agentId, uint256 tokensIn) internal view returns (uint256) {
        AgentConfig memory config = agentConfigs[agentId];
        AgentState memory state = agentStates[agentId];
        
        uint256 priceAtStart = getCurrentPrice(agentId);
        
        // Calculate price at end of sell
        uint256 supplyAfter = state.tokensSold - tokensIn;
        uint256 priceRange = config.p1 - config.p0;
        uint256 priceAtEnd = config.p0 + (priceRange * supplyAfter) / GRADUATION_SUPPLY;
        
        // Average price method: promptOut = tokens * (priceStart + priceEnd) / 2
        uint256 promptOut = (tokensIn * (priceAtStart + priceAtEnd)) / (2 * 10**18);
        
        return promptOut;
    }
    
    /**
     * @notice Distribute buy fees to creator, platform, and LP fund
     */
    function _distributeBuyFees(address creator, uint256 fee) internal {
        uint256 creatorFee = (fee * creatorFeeBps) / BASIS_POINTS;
        uint256 platformFee = (fee * platformFeeBps) / BASIS_POINTS;
        uint256 lpFee = (fee * lpFeeBps) / BASIS_POINTS;
        
        require(promptToken.transfer(creator, creatorFee), "Creator fee transfer failed");
        require(promptToken.transfer(platformVault, platformFee), "Platform fee transfer failed");
        require(promptToken.transfer(treasury, lpFee), "LP fee transfer failed");
    }
    
    /**
     * @notice Distribute sell fees to creator, platform, and LP fund
     */
    function _distributeSellFees(address creator, uint256 fee) internal {
        uint256 creatorFee = (fee * creatorFeeBps) / BASIS_POINTS;
        uint256 platformFee = (fee * platformFeeBps) / BASIS_POINTS;
        uint256 lpFee = (fee * lpFeeBps) / BASIS_POINTS;
        
        require(promptToken.transfer(creator, creatorFee), "Creator fee transfer failed");
        require(promptToken.transfer(platformVault, platformFee), "Platform fee transfer failed");
        require(promptToken.transfer(treasury, lpFee), "LP fee transfer failed");
    }
    
    /**
     * @notice Check if an agent can graduate
     */
    function _canGraduate(bytes32 agentId) internal view returns (bool) {
        AgentConfig memory config = agentConfigs[agentId];
        AgentState memory state = agentStates[agentId];
        
        return state.promptReserves >= config.graduationThresholdPrompt;
    }
    
    /**
     * @notice Graduate an agent (transition to DEX)
     */
    function _graduate(bytes32 agentId) internal {
        AgentState storage state = agentStates[agentId];
        
        state.phase = AgentPhase.Graduated;
        
        emit Graduated(agentId, state.tokensSold, state.promptReserves, block.timestamp);
        
        // Note: Actual DEX integration would happen here
        // For testnet, we just emit the event
    }
    
    /**
     * @notice Update buy and sell fees
     * @param _buyFeeBps New buy fee in basis points (max 1000 = 10%)
     * @param _sellFeeBps New sell fee in basis points (max 1000 = 10%)
     */
    function setFees(uint256 _buyFeeBps, uint256 _sellFeeBps) external onlyOwner {
        require(_buyFeeBps <= 1000, "Buy fee too high"); // Max 10%
        require(_sellFeeBps <= 1000, "Sell fee too high"); // Max 10%
        buyFeeBps = _buyFeeBps;
        sellFeeBps = _sellFeeBps;
        emit FeesUpdated(_buyFeeBps, _sellFeeBps);
    }
    
    /**
     * @notice Update fee distribution percentages
     * @param _creatorFeeBps Percentage to creator (basis points)
     * @param _platformFeeBps Percentage to platform (basis points)
     * @param _lpFeeBps Percentage to LP/treasury (basis points)
     * @dev Must sum to exactly 10000 (100%)
     */
    function setFeeDistribution(
        uint256 _creatorFeeBps,
        uint256 _platformFeeBps,
        uint256 _lpFeeBps
    ) external onlyOwner {
        require(
            _creatorFeeBps + _platformFeeBps + _lpFeeBps == BASIS_POINTS,
            "Fee distribution must sum to 100%"
        );
        creatorFeeBps = _creatorFeeBps;
        platformFeeBps = _platformFeeBps;
        lpFeeBps = _lpFeeBps;
        emit FeeDistributionUpdated(_creatorFeeBps, _platformFeeBps, _lpFeeBps);
    }
    
    /**
     * @notice Update default graduation threshold for new agents
     * @param _newThreshold New threshold in PROMPT (with 18 decimals)
     */
    function setDefaultGraduationThreshold(uint256 _newThreshold) external onlyOwner {
        require(_newThreshold > 0, "Threshold must be positive");
        defaultGraduationThreshold = _newThreshold;
        emit DefaultGraduationThresholdUpdated(_newThreshold);
    }
    
    /**
     * @notice Update platform vault address
     */
    function updatePlatformVault(address _platformVault) external onlyOwner {
        require(_platformVault != address(0), "Invalid address");
        platformVault = _platformVault;
        emit PlatformVaultUpdated(_platformVault);
    }
    
    /**
     * @notice Update treasury address
     */
    function updateTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
}
