// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface IERC20Extended {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract AgentToken is ERC20, ReentrancyGuard {
    // Bonding curve parameters (matching virtuals.io model)
    uint256 public constant VIRTUAL_PROMPT_RESERVE = 30 * 10**18; // 30 PROMPT
    uint256 public constant VIRTUAL_TOKEN_RESERVE = 1073000000 * 10**18; // 1.073B tokens
    uint256 public constant TOTAL_SUPPLY = 1000000000 * 10**18; // 1B tokens
    uint256 public constant GRADUATION_THRESHOLD = 42000 * 10**18; // 42k PROMPT
    
    // Fee structure (1% total: 70% agent, 30% platform)
    uint256 public constant TRADING_FEE = 100; // 1% (100 basis points)
    uint256 public constant AGENT_FEE = 70; // 70% of trading fee
    uint256 public constant PLATFORM_FEE = 30; // 30% of trading fee
    
    // Contract state
    address public immutable factory;
    address public immutable promptToken;
    address public immutable agent;
    address public immutable platform;
    
    uint256 public tokensSold;
    uint256 public promptRaised;
    bool public graduated;
    address public liquidityPool;
    
    // Events
    event TokensBought(address indexed buyer, uint256 promptSpent, uint256 tokensReceived);
    event TokensSold(address indexed seller, uint256 tokensSold, uint256 promptReceived);
    event AgentGraduated(address indexed liquidityPool, uint256 finalPromptRaised);
    event FeesDistributed(uint256 agentFee, uint256 platformFee);
    
    constructor(
        string memory name,
        string memory symbol,
        address _agent,
        address _platform,
        address _promptToken
    ) ERC20(name, symbol) {
        factory = msg.sender;
        agent = _agent;
        platform = _platform;
        promptToken = _promptToken;
        
        // Mint all tokens to this contract initially
        _mint(address(this), TOTAL_SUPPLY);
    }
    
    /**
     * @dev Calculate current price based on bonding curve
     * Uses constant product formula: k = x * y
     */
    function getCurrentPrice() public view returns (uint256) {
        uint256 k = VIRTUAL_PROMPT_RESERVE * VIRTUAL_TOKEN_RESERVE;
        uint256 currentTokenReserve = VIRTUAL_TOKEN_RESERVE - tokensSold;
        uint256 currentPromptReserve = k / currentTokenReserve;
        
        return (currentPromptReserve * 10**18) / currentTokenReserve;
    }
    
    /**
     * @dev Calculate cost to buy specific amount of tokens
     */
    function calculateBuyCost(uint256 tokenAmount) public view returns (uint256 cost, uint256 fee) {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(tokensSold + tokenAmount <= TOTAL_SUPPLY, "Exceeds total supply");
        
        uint256 k = VIRTUAL_PROMPT_RESERVE * VIRTUAL_TOKEN_RESERVE;
        uint256 currentTokenReserve = VIRTUAL_TOKEN_RESERVE - tokensSold;
        uint256 newTokenReserve = currentTokenReserve - tokenAmount;
        
        uint256 currentPromptReserve = k / currentTokenReserve;
        uint256 newPromptReserve = k / newTokenReserve;
        
        cost = newPromptReserve - currentPromptReserve;
        fee = (cost * TRADING_FEE) / 10000;
    }
    
    /**
     * @dev Calculate return from selling specific amount of tokens
     */
    function calculateSellReturn(uint256 tokenAmount) public view returns (uint256 returnAmount, uint256 fee) {
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(tokenAmount <= balanceOf(msg.sender), "Insufficient token balance");
        
        uint256 k = VIRTUAL_PROMPT_RESERVE * VIRTUAL_TOKEN_RESERVE;
        uint256 currentTokenReserve = VIRTUAL_TOKEN_RESERVE - tokensSold;
        uint256 newTokenReserve = currentTokenReserve + tokenAmount;
        
        uint256 currentPromptReserve = k / currentTokenReserve;
        uint256 newPromptReserve = k / newTokenReserve;
        
        returnAmount = currentPromptReserve - newPromptReserve;
        fee = (returnAmount * TRADING_FEE) / 10000;
    }
    
    /**
     * @dev Buy tokens with PROMPT (both buy and sell have 1% fee)
     */
    function buyTokens(uint256 tokenAmount) external nonReentrant {
        require(!graduated, "Agent has graduated");
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(tokensSold + tokenAmount <= TOTAL_SUPPLY, "Exceeds total supply");
        
        (uint256 cost, uint256 fee) = calculateBuyCost(tokenAmount);
        uint256 totalCost = cost + fee;
        
        require(
            IERC20Extended(promptToken).transferFrom(msg.sender, address(this), totalCost),
            "PROMPT transfer failed"
        );
        
        // Transfer tokens to buyer
        _transfer(address(this), msg.sender, tokenAmount);
        
        // Update state
        tokensSold += tokenAmount;
        promptRaised += cost;
        
        // Distribute fees
        _distributeFees(fee);
        
        emit TokensBought(msg.sender, totalCost, tokenAmount);
        
        // Check if graduated
        if (promptRaised >= GRADUATION_THRESHOLD) {
            _graduate();
        }
    }
    
    /**
     * @dev Sell tokens for PROMPT (both buy and sell have 1% fee)
     */
    function sellTokens(uint256 tokenAmount) external nonReentrant {
        require(!graduated, "Agent has graduated");
        require(tokenAmount > 0, "Token amount must be greater than 0");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        (uint256 returnAmount, uint256 fee) = calculateSellReturn(tokenAmount);
        uint256 netReturn = returnAmount - fee;
        
        // Transfer tokens back to contract
        _transfer(msg.sender, address(this), tokenAmount);
        
        // Update state
        tokensSold -= tokenAmount;
        promptRaised -= returnAmount;
        
        // Transfer PROMPT to seller
        require(
            IERC20Extended(promptToken).transfer(msg.sender, netReturn),
            "PROMPT transfer failed"
        );
        
        // Distribute fees
        _distributeFees(fee);
        
        emit TokensSold(msg.sender, tokenAmount, netReturn);
    }
    
    /**
     * @dev Internal function to distribute trading fees (70% agent, 30% platform)
     */
    function _distributeFees(uint256 totalFee) internal {
        uint256 agentFee = (totalFee * AGENT_FEE) / 100;
        uint256 platformFee = totalFee - agentFee;
        
        if (agentFee > 0) {
            IERC20Extended(promptToken).transfer(agent, agentFee);
        }
        
        if (platformFee > 0) {
            IERC20Extended(promptToken).transfer(platform, platformFee);
        }
        
        emit FeesDistributed(agentFee, platformFee);
    }
    
    /**
     * @dev Graduate agent to DEX (called automatically when threshold met)
     */
    function _graduate() internal {
        graduated = true;
        
        // All remaining PROMPT and all tokens go to LP
        uint256 promptForLP = IERC20Extended(promptToken).balanceOf(address(this));
        uint256 tokensForLP = balanceOf(address(this));
        
        // TODO: Create liquidity pool on DEX (Uniswap V2/V3 style)
        // For now, we just mark as graduated and lock liquidity for 10 years
        
        emit AgentGraduated(liquidityPool, promptRaised);
    }
    
    /**
     * @dev Check if agent can graduate
     */
    function canGraduate() public view returns (bool) {
        return promptRaised >= GRADUATION_THRESHOLD && !graduated;
    }
    
    /**
     * @dev Get graduation progress (0-100%)
     */
    function getGraduationProgress() public view returns (uint256) {
        if (promptRaised >= GRADUATION_THRESHOLD) return 100;
        return (promptRaised * 100) / GRADUATION_THRESHOLD;
    }
    
    /**
     * @dev Get current token metrics
     */
    function getTokenMetrics() external view returns (
        uint256 _promptRaised,
        uint256 _currentPrice,
        uint256 _marketCap,
        uint256 _circulatingSupply,
        bool _graduated
    ) {
        uint256 circulatingSupply = tokensSold;
        uint256 currentPrice = getCurrentPrice();
        uint256 marketCap = currentPrice * TOTAL_SUPPLY;
        
        return (
            promptRaised,
            currentPrice,
            marketCap,
            circulatingSupply,
            graduated
        );
    }
}

contract AgentTokenFactoryV2 is Ownable, ReentrancyGuard {
    address public immutable promptToken;
    address public treasury;
    
    uint256 public constant CREATION_FEE = 100 * 10**18; // 100 PROMPT
    uint256 public constant PLATFORM_FEE_BPS = 200; // 2%
    uint256 public constant CREATOR_FEE_BPS = 300; // 3%
    
    mapping(address => address) public agentToToken;
    mapping(address => bool) public isAgentToken;
    address[] public allAgentTokens;
    
    event AgentTokenCreated(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        string agentId
    );
    
    event AgentTokenCreatedWithPrebuy(
        address indexed creator,
        address indexed tokenAddress,
        string name,
        string symbol,
        string agentId,
        uint256 prebuyAmount,
        uint256 tokensReceived
    );
    
    constructor(address _promptToken, address _treasury) {
        promptToken = _promptToken;
        treasury = _treasury;
    }
    
    function createAgentToken(
        string memory name,
        string memory symbol,
        string memory agentId
    ) external nonReentrant returns (address) {
        // Charge creation fee
        IERC20Extended(promptToken).transferFrom(msg.sender, treasury, CREATION_FEE);
        
        // Deploy new agent token
        AgentToken newToken = new AgentToken(
            name,
            symbol,
            msg.sender,  // agent
            treasury,    // platform
            promptToken  // promptToken
        );
        
        address tokenAddress = address(newToken);
        agentToToken[msg.sender] = tokenAddress;
        isAgentToken[tokenAddress] = true;
        allAgentTokens.push(tokenAddress);
        
        emit AgentTokenCreated(msg.sender, tokenAddress, name, symbol, agentId);
        
        return tokenAddress;
    }
    
    /**
     * @dev Create agent token with immediate prebuy - ATOMIC MEV PROTECTION
     * This function combines token creation and prebuy in a single transaction
     */
    function createAgentTokenWithPrebuy(
        string memory name,
        string memory symbol,
        string memory agentId,
        uint256 prebuyPromptAmount
    ) external nonReentrant returns (address tokenAddress, uint256 tokensReceived) {
        require(prebuyPromptAmount > 0, "Prebuy amount must be greater than 0");
        
        // Calculate total cost: creation fee + prebuy amount + trading fee
        uint256 totalCost = CREATION_FEE + prebuyPromptAmount;
        
        // Take all PROMPT from creator upfront
        IERC20Extended(promptToken).transferFrom(msg.sender, address(this), totalCost);
        
        // Deploy new agent token
        AgentToken newToken = new AgentToken(
            name,
            symbol,
            msg.sender,  // agent
            treasury,    // platform
            promptToken  // promptToken
        );
        
        tokenAddress = address(newToken);
        agentToToken[msg.sender] = tokenAddress;
        isAgentToken[tokenAddress] = true;
        allAgentTokens.push(tokenAddress);
        
        // Send creation fee to treasury
        IERC20Extended(promptToken).transfer(treasury, CREATION_FEE);
        
        // Approve the new token contract to spend our PROMPT for the prebuy
        IERC20Extended(promptToken).approve(tokenAddress, prebuyPromptAmount);
        
        // Calculate how many tokens we can buy with the prebuy amount
        (uint256 cost, uint256 fee) = newToken.calculateBuyCost(prebuyPromptAmount);
        uint256 totalPrebuyTokens = prebuyPromptAmount; // This is actually the token amount we want
        
        // Execute the prebuy transaction on behalf of the creator
        // Transfer tokens directly to creator since we're acting as intermediary
        newToken.buyTokens(totalPrebuyTokens);
        
        // Transfer all received tokens to the creator
        tokensReceived = IERC20(tokenAddress).balanceOf(address(this));
        if (tokensReceived > 0) {
            IERC20(tokenAddress).transfer(msg.sender, tokensReceived);
        }
        
        emit AgentTokenCreatedWithPrebuy(
            msg.sender, 
            tokenAddress, 
            name, 
            symbol, 
            agentId, 
            prebuyPromptAmount, 
            tokensReceived
        );
        
        return (tokenAddress, tokensReceived);
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allAgentTokens;
    }
    
    function updateTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
}