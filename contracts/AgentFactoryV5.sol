// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./AgentTokenV5.sol";
import "./BondingCurveV5.sol";

/**
 * @title AgentFactoryV5
 * @notice Factory for deploying new agent tokens and registering them with BondingCurveV5
 * @dev Simplified factory that creates tokens and registers them in one transaction
 */
contract AgentFactoryV5 {
    BondingCurveV5 public immutable bondingCurve;
    
    event AgentCreated(
        bytes32 indexed agentId,
        address indexed agentToken,
        address indexed creator,
        string name,
        string symbol,
        uint256 timestamp
    );
    
    constructor(address _bondingCurve) {
        require(_bondingCurve != address(0), "Invalid bonding curve");
        bondingCurve = BondingCurveV5(_bondingCurve);
    }
    
    /**
     * @notice Create a new agent token and register with bonding curve
     * @param name Token name
     * @param symbol Token symbol
     * @param p0 Starting price in PROMPT (18 decimals)
     * @param p1 Ending price at graduation (18 decimals)
     * @param graduationThresholdPrompt PROMPT reserves needed to graduate
     * @return agentId Unique identifier for the agent
     * @return agentToken Address of the created token
     */
    function createAgent(
        string memory name,
        string memory symbol,
        uint256 p0,
        uint256 p1,
        uint256 graduationThresholdPrompt
    ) external returns (bytes32 agentId, address agentToken) {
        // Generate unique agent ID
        agentId = keccak256(abi.encodePacked(name, symbol, msg.sender, block.timestamp));
        
        // Deploy new agent token
        AgentTokenV5 token = new AgentTokenV5(name, symbol, address(this));
        agentToken = address(token);
        
        // Set bonding curve as minter
        token.setBondingCurve(address(bondingCurve));
        
        // Register with bonding curve
        bondingCurve.registerAgent(
            agentId,
            agentToken,
            msg.sender,
            p0,
            p1,
            graduationThresholdPrompt
        );
        
        // Transfer ownership to creator
        token.transferOwnership(msg.sender);
        
        emit AgentCreated(agentId, agentToken, msg.sender, name, symbol, block.timestamp);
        
        return (agentId, agentToken);
    }
}
