// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BondingCurveV5.sol";

/**
 * @title BondingCurveViewV5
 * @notice Read-only helper contract for fetching comprehensive agent metrics
 * @dev Provides a single-call interface for frontend/indexer to get all agent data
 */
contract BondingCurveViewV5 {
    BondingCurveV5 public immutable bondingCurve;
    
    struct AgentMetrics {
        // Price data
        uint256 currentPrice;        // Current price in PROMPT (18 decimals)
        
        // Supply data
        uint256 tokensSold;          // Tokens currently in circulation
        uint256 graduationSupply;    // Total supply at graduation (1M)
        
        // Reserve data
        uint256 promptReserves;      // PROMPT held in bonding curve
        uint256 graduationThreshold; // PROMPT needed to graduate
        
        // Progress
        uint256 graduationProgress;  // Percentage (0-10000 basis points)
        bool canGraduate;            // Whether graduation threshold is met
        
        // Phase
        uint8 phase;                 // 0 = Active, 1 = Graduated
        
        // Config
        uint256 p0;                  // Starting price
        uint256 p1;                  // Ending price
        address creator;             // Agent creator
        address agentToken;          // ERC20 token address
        
        // Fee config
        uint256 buyFeeBps;
        uint256 sellFeeBps;
        uint256 creatorFeeBps;
        uint256 platformFeeBps;
        uint256 lpFeeBps;
    }
    
    constructor(address _bondingCurve) {
        require(_bondingCurve != address(0), "Invalid bonding curve");
        bondingCurve = BondingCurveV5(_bondingCurve);
    }
    
    /**
     * @notice Get comprehensive metrics for an agent
     * @param agentId Unique identifier for the agent
     * @return metrics Complete metrics struct
     */
    function getMetrics(bytes32 agentId) external view returns (AgentMetrics memory metrics) {
        // Fetch config and state
        (
            uint256 p0,
            uint256 p1,
            uint256 graduationThresholdPrompt,
            address creator,
            address agentToken
        ) = bondingCurve.agentConfigs(agentId);
        
        (
            uint256 tokensSold,
            uint256 promptReserves,
            BondingCurveV5.AgentPhase phase
        ) = bondingCurve.agentStates(agentId);
        
        // Calculate current price
        uint256 currentPrice = bondingCurve.getCurrentPrice(agentId);
        
        // Calculate graduation progress (in basis points for precision)
        uint256 progress = graduationThresholdPrompt > 0
            ? (promptReserves * 10000) / graduationThresholdPrompt
            : 0;
        if (progress > 10000) progress = 10000;
        
        // Check if can graduate
        bool canGrad = promptReserves >= graduationThresholdPrompt;
        
        // Get fee configuration
        uint256 buyFee = bondingCurve.buyFeeBps();
        uint256 sellFee = bondingCurve.sellFeeBps();
        uint256 creatorFee = bondingCurve.creatorFeeBps();
        uint256 platformFee = bondingCurve.platformFeeBps();
        uint256 lpFee = bondingCurve.lpFeeBps();
        
        // Assemble metrics
        metrics = AgentMetrics({
            currentPrice: currentPrice,
            tokensSold: tokensSold,
            graduationSupply: bondingCurve.GRADUATION_SUPPLY(),
            promptReserves: promptReserves,
            graduationThreshold: graduationThresholdPrompt,
            graduationProgress: progress,
            canGraduate: canGrad,
            phase: uint8(phase),
            p0: p0,
            p1: p1,
            creator: creator,
            agentToken: agentToken,
            buyFeeBps: buyFee,
            sellFeeBps: sellFee,
            creatorFeeBps: creatorFee,
            platformFeeBps: platformFee,
            lpFeeBps: lpFee
        });
        
        return metrics;
    }
    
    /**
     * @notice Batch fetch metrics for multiple agents
     * @param agentIds Array of agent identifiers
     * @return metricsArray Array of metrics structs
     */
    function getMetricsBatch(bytes32[] calldata agentIds) 
        external 
        view 
        returns (AgentMetrics[] memory metricsArray) 
    {
        metricsArray = new AgentMetrics[](agentIds.length);
        
        for (uint256 i = 0; i < agentIds.length; i++) {
            metricsArray[i] = this.getMetrics(agentIds[i]);
        }
        
        return metricsArray;
    }
}
