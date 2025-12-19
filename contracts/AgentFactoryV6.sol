// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./AgentTokenV6.sol";

/**
 * @title AgentFactoryV6
 * @notice Factory for deploying agent tokens (database mode)
 * @dev Simplified for database mode - no tokens minted at creation
 * 
 * Key Features:
 * - Charges 100 PROMPT fee to vault
 * - Deploys AgentTokenV6 (NO tokens minted)
 * - Transfers ownership to GraduationManager
 * - Simple and gas-efficient
 */
contract AgentFactoryV6 {
    using SafeERC20 for IERC20;
    
    IERC20 public immutable promptToken;
    address public immutable vault;
    address public immutable graduationManager;
    
    uint256 public constant CREATION_FEE = 100e18; // 100 PROMPT
    
    event AgentCreated(
        address indexed agentToken,
        address indexed creator,
        string name,
        string symbol,
        uint256 timestamp
    );
    
    constructor(
        address _promptToken,
        address _vault,
        address _graduationManager
    ) {
        require(_promptToken != address(0), "Invalid PROMPT");
        require(_vault != address(0), "Invalid vault");
        require(_graduationManager != address(0), "Invalid manager");
        
        promptToken = IERC20(_promptToken);
        vault = _vault;
        graduationManager = _graduationManager;
    }
    
    /**
     * @notice Create new agent token
     * @dev Database mode - no tokens minted until graduation
     * @param name Token name
     * @param symbol Token symbol
     * @return agentToken Address of deployed token
     */
    function createAgent(
        string memory name,
        string memory symbol
    ) external returns (address agentToken) {
        // 1. Charge 100 PROMPT creation fee
        promptToken.safeTransferFrom(msg.sender, vault, CREATION_FEE);
        
        // 2. Deploy token (no tokens minted yet)
        AgentTokenV6 token = new AgentTokenV6(
            name,
            symbol,
            graduationManager,
            address(this)
        );
        
        agentToken = address(token);
        
        // 3. Transfer ownership to graduation manager
        token.transferOwnership(graduationManager);
        
        emit AgentCreated(agentToken, msg.sender, name, symbol, block.timestamp);
        
        return agentToken;
    }
}
