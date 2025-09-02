// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AgentTokenV2
 * @dev Enhanced agent token with slippage protection and improved bonding curve
 * @notice This is the V2 implementation with built-in slippage protection
 */
contract AgentTokenV2 is ERC20, Ownable, ReentrancyGuard {
    
    // Version identifier
    string public constant version = "v2";
    
    // Agent metadata
    string public agentId;
    
    // PROMPT token interface
    IERC20 public immutable promptToken;
    
    // Bonding curve parameters
    uint256 public constant INITIAL_PRICE = 1e15; // 0.001 PROMPT per token
    uint256 public constant PRICE_INCREMENT = 1e12; // Price increases by 0.000001 PROMPT per token sold
    uint256 public constant GRADUATION_THRESHOLD = 42000e18; // 42,000 PROMPT raised
    uint256 public constant MAX_SUPPLY = 1000000e18; // 1M tokens max supply
    
    // State variables
    uint256 public promptRaised;
    uint256 public circulatingSupply;
    bool public graduated;
    
    // Fee configuration (in basis points)
    uint256 public constant CREATOR_FEE = 200; // 2%
    uint256 public constant PLATFORM_FEE = 100; // 1%
    uint256 public constant FEE_BASE = 10000;
    
    // Fee recipients
    address public creator;
    address public platformTreasury;
    
    // Platform allocation state
    bool public initialDistributionComplete;
    address public platformVault;
    uint256 public constant PLATFORM_ALLOCATION = 4_000_000 * 10**18; // 4M tokens (2% of 200M LP)
    uint256 public constant LP_ALLOCATION = 196_000_000 * 10**18; // 196M tokens (remaining LP)

    // Events
    event InitialDistributionComplete(
        address indexed platformVault, 
        uint256 platformAmount, 
        address indexed lpRecipient, 
        uint256 lpAmount
    );
    event TokensPurchased(
        address indexed buyer,
        uint256 promptAmount,
        uint256 tokensReceived,
        uint256 currentPrice,
        uint256 slippageProtection
    );
    
    event TokensSold(
        address indexed seller,
        uint256 tokensAmount,
        uint256 promptReceived,
        uint256 currentPrice,
        uint256 slippageProtection
    );
    
    event Graduated(uint256 finalPrice, uint256 totalSupply);
    
    // Custom errors
    error InsufficientPromptAllowance();
    error InsufficientTokenBalance();
    error SlippageTooHigh();
    error ContractGraduated();
    error InvalidAmount();
    error TransferFailed();
    
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _agentId,
        address _promptToken,
        address _creator,
        address _platformTreasury
    ) ERC20(_name, _symbol) {
        agentId = _agentId;
        promptToken = IERC20(_promptToken);
        creator = _creator;
        platformTreasury = _platformTreasury;
        
        // Transfer ownership to creator
        _transferOwnership(_creator);
    }
    
    /**
     * @dev Calculate current token price based on circulating supply
     */
    function getCurrentPrice() public view returns (uint256) {
        return INITIAL_PRICE + (circulatingSupply * PRICE_INCREMENT / 1e18);
    }
    
    /**
     * @dev Calculate how many tokens can be bought with given PROMPT amount
     */
    function getBuyPrice(uint256 promptAmount) public view returns (uint256) {
        if (promptAmount == 0) return 0;
        
        uint256 currentPrice = getCurrentPrice();
        uint256 tokensFromFixedPrice = (promptAmount * 1e18) / currentPrice;
        
        // Apply price curve effect (simplified quadratic bonding curve)
        uint256 priceImpact = (tokensFromFixedPrice * PRICE_INCREMENT) / (2 * 1e18);
        uint256 effectivePrice = currentPrice + priceImpact;
        
        return (promptAmount * 1e18) / effectivePrice;
    }
    
    /**
     * @dev Calculate how much PROMPT received when selling tokens
     */
    function getSellPrice(uint256 tokenAmount) public view returns (uint256) {
        if (tokenAmount == 0) return 0;
        if (tokenAmount > circulatingSupply) return 0;
        
        uint256 currentPrice = getCurrentPrice();
        
        // Apply price curve effect (with slippage for large sells)
        uint256 priceImpact = (tokenAmount * PRICE_INCREMENT) / (2 * 1e18);
        uint256 effectivePrice = currentPrice > priceImpact ? currentPrice - priceImpact : currentPrice / 2;
        
        return (tokenAmount * effectivePrice) / 1e18;
    }
    
    /**
     * @dev Buy tokens with slippage protection
     * @param promptAmount Amount of PROMPT to spend
     * @param minTokensOut Minimum tokens expected (slippage protection)
     */
    function buyTokens(
        uint256 promptAmount,
        uint256 minTokensOut
    ) external nonReentrant {
        if (graduated) revert ContractGraduated();
        if (promptAmount == 0) revert InvalidAmount();
        
        // Calculate tokens to receive
        uint256 tokensToMint = getBuyPrice(promptAmount);
        
        // Slippage protection
        if (tokensToMint < minTokensOut) {
            revert SlippageTooHigh();
        }
        
        // Check if this purchase would exceed max supply
        if (circulatingSupply + tokensToMint > MAX_SUPPLY) {
            tokensToMint = MAX_SUPPLY - circulatingSupply;
            // Recalculate required PROMPT for adjusted token amount
            uint256 currentPrice = getCurrentPrice();
            promptAmount = (tokensToMint * currentPrice) / 1e18;
        }
        
        // Calculate fees
        uint256 creatorFee = (promptAmount * CREATOR_FEE) / FEE_BASE;
        uint256 platformFee = (promptAmount * PLATFORM_FEE) / FEE_BASE;
        uint256 netPromptAmount = promptAmount - creatorFee - platformFee;
        
        // Transfer PROMPT from buyer
        bool success = promptToken.transferFrom(msg.sender, address(this), netPromptAmount);
        if (!success) revert TransferFailed();
        
        // Transfer fees
        if (creatorFee > 0) {
            promptToken.transferFrom(msg.sender, creator, creatorFee);
        }
        if (platformFee > 0) {
            promptToken.transferFrom(msg.sender, platformTreasury, platformFee);
        }
        
        // Update state
        promptRaised += netPromptAmount;
        circulatingSupply += tokensToMint;
        
        // Mint tokens to buyer
        _mint(msg.sender, tokensToMint);
        
        // Check for graduation
        if (promptRaised >= GRADUATION_THRESHOLD && !graduated) {
            graduated = true;
            emit Graduated(getCurrentPrice(), totalSupply());
        }
        
        emit TokensPurchased(
            msg.sender,
            promptAmount,
            tokensToMint,
            getCurrentPrice(),
            minTokensOut
        );
    }
    
    /**
     * @dev Sell tokens with slippage protection
     * @param tokenAmount Amount of tokens to sell
     * @param minPromptOut Minimum PROMPT expected (slippage protection)
     */
    function sellTokens(
        uint256 tokenAmount,
        uint256 minPromptOut
    ) external nonReentrant {
        if (graduated) revert ContractGraduated();
        if (tokenAmount == 0) revert InvalidAmount();
        if (balanceOf(msg.sender) < tokenAmount) revert InsufficientTokenBalance();
        
        // Calculate PROMPT to receive
        uint256 promptToReturn = getSellPrice(tokenAmount);
        
        // Slippage protection
        if (promptToReturn < minPromptOut) {
            revert SlippageTooHigh();
        }
        
        // Check contract has enough PROMPT
        uint256 contractBalance = promptToken.balanceOf(address(this));
        if (contractBalance < promptToReturn) {
            promptToReturn = contractBalance;
        }
        
        // Calculate fees on PROMPT amount
        uint256 creatorFee = (promptToReturn * CREATOR_FEE) / FEE_BASE;
        uint256 platformFee = (promptToReturn * PLATFORM_FEE) / FEE_BASE;
        uint256 netPromptAmount = promptToReturn - creatorFee - platformFee;
        
        // Burn tokens from seller
        _burn(msg.sender, tokenAmount);
        
        // Update state
        promptRaised = promptRaised > netPromptAmount ? promptRaised - netPromptAmount : 0;
        circulatingSupply -= tokenAmount;
        
        // Transfer PROMPT to seller
        bool success = promptToken.transfer(msg.sender, netPromptAmount);
        if (!success) revert TransferFailed();
        
        // Transfer fees
        if (creatorFee > 0) {
            promptToken.transfer(creator, creatorFee);
        }
        if (platformFee > 0) {
            promptToken.transfer(platformTreasury, platformFee);
        }
        
        emit TokensSold(
            msg.sender,
            tokenAmount,
            netPromptAmount,
            getCurrentPrice(),
            minPromptOut
        );
    }
    
    /**
     * @dev Get comprehensive token metrics
     */
    function getTokenMetrics() external view returns (
        uint256 _promptRaised,
        uint256 _currentPrice,
        uint256 _marketCap,
        uint256 _circulatingSupply,
        bool _graduated
    ) {
        _promptRaised = promptRaised;
        _currentPrice = getCurrentPrice();
        _marketCap = (_circulatingSupply * _currentPrice) / 1e18;
        _circulatingSupply = circulatingSupply;
        _graduated = graduated;
    }
    
    /**
     * @dev Execute one-time initial distribution to platform vault and LP recipient
     * @param _platformVault Address of the platform vault contract
     * @param _lpRecipient Address to receive LP allocation (usually this contract for graduation)
     */
    function executeInitialDistribution(address _platformVault, address _lpRecipient) external onlyOwner {
        require(!initialDistributionComplete, "Distribution already complete");
        require(_platformVault != address(0), "Invalid vault address");
        require(_lpRecipient != address(0), "Invalid LP recipient");

        initialDistributionComplete = true;
        platformVault = _platformVault;

        // Mint platform allocation to vault (2% of original 200M LP allocation)
        _mint(_platformVault, PLATFORM_ALLOCATION);

        // Mint LP allocation to LP recipient (remaining 98% of LP allocation)
        _mint(_lpRecipient, LP_ALLOCATION);

        emit InitialDistributionComplete(_platformVault, PLATFORM_ALLOCATION, _lpRecipient, LP_ALLOCATION);
    }

    /**
     * @dev Migration support - check if user eligible for migration from V1
     */
    function getMigrationEligibility(address holder) external view returns (
        bool eligible,
        uint256 v1Balance,
        uint256 migrationRatio
    ) {
        // This would integrate with V1 contract to check balance
        // For now, return basic info
        eligible = true; // Would check V1 contract
        v1Balance = 0; // Would query V1 contract
        migrationRatio = 1000; // 1:1 ratio (1000 = 1.000)
    }
    
    /**
     * @dev Migration function to mint V2 tokens for V1 holders
     * @param v1Contract Address of the V1 contract
     * @dev Only owner can call this during migration period
     */
    function migrateFromV1(address v1Contract) external onlyOwner {
        // Implementation would:
        // 1. Verify V1 contract is legitimate
        // 2. Check user's V1 balance
        // 3. Burn/lock V1 tokens
        // 4. Mint equivalent V2 tokens
        // This is a placeholder for the migration logic
        revert("Migration not yet implemented");
    }
    
    /**
     * @dev Emergency pause function (only owner)
     */
    function emergencyPause() external onlyOwner {
        // Implementation for emergency pause
        // Could use OpenZeppelin's Pausable if needed
    }
    
    /**
     * @dev Get contract version
     */
    function getVersion() external pure returns (string memory) {
        return version;
    }
}