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

contract AgentToken is ERC20, Ownable {
    uint256 public constant GRADUATION_THRESHOLD = 42000 * 10**18; // 42k PROMPT
    uint256 public constant VIRTUAL_SUPPLY = 1000000000 * 10**18; // 1B tokens
    
    address public immutable promptToken;
    address public immutable creator;
    address public immutable factory;
    
    uint256 public promptRaised;
    bool public graduated;
    
    uint256 private constant BONDING_CURVE_FACTOR = 1000000; // Linear bonding curve
    
    event TokensPurchased(address indexed buyer, uint256 promptAmount, uint256 tokensReceived);
    event TokensSold(address indexed seller, uint256 tokensAmount, uint256 promptReceived);
    event Graduated(uint256 finalPrice, uint256 liquidityAdded);
    
    constructor(
        string memory name,
        string memory symbol,
        address _creator,
        address _promptToken,
        address _factory
    ) ERC20(name, symbol) {
        creator = _creator;
        promptToken = _promptToken;
        factory = _factory;
        _transferOwnership(_factory);
        
        // Mint virtual supply to this contract
        _mint(address(this), VIRTUAL_SUPPLY);
    }
    
    function getBuyPrice(uint256 promptAmount) public view returns (uint256) {
        if (graduated) return 0;
        
        uint256 currentSupply = totalSupply() - balanceOf(address(this));
        uint256 newSupply = currentSupply + promptAmount * BONDING_CURVE_FACTOR;
        
        return promptAmount * BONDING_CURVE_FACTOR;
    }
    
    function getSellPrice(uint256 tokenAmount) public view returns (uint256) {
        if (graduated) return 0;
        
        uint256 currentSupply = totalSupply() - balanceOf(address(this));
        if (tokenAmount > currentSupply) return 0;
        
        return tokenAmount / BONDING_CURVE_FACTOR;
    }
    
    function buyTokens(uint256 promptAmount) external {
        require(!graduated, "Token has graduated");
        require(promptAmount > 0, "Amount must be > 0");
        
        uint256 tokensToMint = getBuyPrice(promptAmount);
        require(tokensToMint <= balanceOf(address(this)), "Insufficient token supply");
        
        // Transfer PROMPT from buyer
        IERC20Extended(promptToken).transferFrom(msg.sender, address(this), promptAmount);
        
        // Transfer tokens to buyer
        _transfer(address(this), msg.sender, tokensToMint);
        
        promptRaised += promptAmount;
        
        emit TokensPurchased(msg.sender, promptAmount, tokensToMint);
        
        // Check graduation
        if (promptRaised >= GRADUATION_THRESHOLD) {
            _graduate();
        }
    }
    
    function sellTokens(uint256 tokenAmount) external {
        require(!graduated, "Token has graduated");
        require(tokenAmount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= tokenAmount, "Insufficient token balance");
        
        uint256 promptToReturn = getSellPrice(tokenAmount);
        require(promptToReturn > 0, "Invalid sell amount");
        
        // Transfer tokens back to contract
        _transfer(msg.sender, address(this), tokenAmount);
        
        // Transfer PROMPT to seller
        IERC20Extended(promptToken).transfer(msg.sender, promptToReturn);
        
        promptRaised -= promptToReturn;
        
        emit TokensSold(msg.sender, tokenAmount, promptToReturn);
    }
    
    function _graduate() private {
        graduated = true;
        
        // Calculate final price and add liquidity
        uint256 currentSupply = totalSupply() - balanceOf(address(this));
        uint256 finalPrice = currentSupply / BONDING_CURVE_FACTOR;
        
        emit Graduated(finalPrice, promptRaised);
        
        // Transfer graduation funds to factory for Uniswap listing
        IERC20Extended(promptToken).transfer(factory, promptRaised);
    }
    
    function getTokenMetrics() external view returns (
        uint256 _promptRaised,
        uint256 _currentPrice,
        uint256 _marketCap,
        uint256 _circulatingSupply,
        bool _graduated
    ) {
        uint256 circulatingSupply = totalSupply() - balanceOf(address(this));
        uint256 currentPrice = circulatingSupply > 0 ? circulatingSupply / BONDING_CURVE_FACTOR : 0;
        
        return (
            promptRaised,
            currentPrice,
            currentPrice * circulatingSupply,
            circulatingSupply,
            graduated
        );
    }
}

contract AgentTokenFactory is Ownable, ReentrancyGuard {
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
            msg.sender,
            promptToken,
            address(this)
        );
        
        address tokenAddress = address(newToken);
        agentToToken[msg.sender] = tokenAddress;
        isAgentToken[tokenAddress] = true;
        allAgentTokens.push(tokenAddress);
        
        emit AgentTokenCreated(msg.sender, tokenAddress, name, symbol, agentId);
        
        return tokenAddress;
    }
    
    function getAllTokens() external view returns (address[] memory) {
        return allAgentTokens;
    }
    
    function updateTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }
}