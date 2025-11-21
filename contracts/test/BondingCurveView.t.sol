// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../BondingCurveV5.sol";
import "../BondingCurveViewV5.sol";
import "../PromptTestToken.sol";
import "../PlatformVault.sol";

contract MockAgentTokenView is ERC20 {
    constructor() ERC20("Mock Agent Token", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

/**
 * @title BondingCurveViewTest
 * @notice Tests for the BondingCurveViewV5 read-only helper contract
 */
contract BondingCurveViewTest is Test {
    BondingCurveV5 public curve;
    BondingCurveViewV5 public curveView;
    PromptTestToken public promptToken;
    MockAgentTokenView public agentToken;
    PlatformVault public platformVault;
    
    bytes32 public constant AGENT_ID = keccak256("TEST_AGENT");
    address public creator = address(2);
    address public treasury = address(3);
    address public user = address(4);
    
    uint256 constant P0 = 0.00001e18;
    uint256 constant P1 = 0.0001e18;
    uint256 constant GRADUATION_THRESHOLD = 8000e18;
    
    function setUp() public {
        // Deploy PROMPT token and platform vault
        promptToken = new PromptTestToken();
        platformVault = new PlatformVault(address(this), address(treasury));
        
        // Deploy bonding curve
        curve = new BondingCurveV5(
            address(promptToken),
            address(platformVault),
            treasury,
            address(this)
        );
        
        // Deploy view helper
        curveView = new BondingCurveViewV5(address(curve));
        
        // Deploy mock agent token
        agentToken = new MockAgentTokenView();
        
        // Register agent
        curve.registerAgent(
            AGENT_ID,
            address(agentToken),
            creator,
            P0,
            P1,
            GRADUATION_THRESHOLD
        );
        
        // Fund test user
        promptToken.transfer(user, 100_000e18);
    }
    
    function testGetMetricsInitialState() public view {
        BondingCurveViewV5.AgentMetrics memory metrics = curveView.getMetrics(AGENT_ID);
        
        assertEq(metrics.tokensSold, 0, "Initial tokens sold should be 0");
        assertEq(metrics.promptReserves, 0, "Initial reserves should be 0");
        assertEq(metrics.currentPrice, P0, "Initial price should be P0");
        assertEq(metrics.graduationProgress, 0, "Initial progress should be 0");
        assertFalse(metrics.canGraduate, "Should not be able to graduate");
        assertEq(metrics.phase, 0, "Should be in Active phase");
    }
    
    function testGetMetricsAfterBuy() public {
        vm.startPrank(user);
        promptToken.approve(address(curve), 1000e18);
        curve.buy(AGENT_ID, 1000e18, 0);
        vm.stopPrank();
        
        BondingCurveViewV5.AgentMetrics memory metrics = curveView.getMetrics(AGENT_ID);
        
        assertGt(metrics.tokensSold, 0, "Should have tokens sold");
        assertGt(metrics.promptReserves, 0, "Should have reserves");
        assertGt(metrics.currentPrice, P0, "Price should increase");
        assertGt(metrics.graduationProgress, 0, "Should have some progress");
        assertFalse(metrics.canGraduate, "Should not be graduated yet");
    }
    
    function testGetMetricsConfiguration() public view {
        BondingCurveViewV5.AgentMetrics memory metrics = curveView.getMetrics(AGENT_ID);
        
        assertEq(metrics.p0, P0, "p0 should match");
        assertEq(metrics.p1, P1, "p1 should match");
        assertEq(metrics.graduationThreshold, GRADUATION_THRESHOLD, "Threshold should match");
        assertEq(metrics.creator, creator, "Creator should match");
        assertEq(metrics.agentToken, address(agentToken), "Token address should match");
    }
    
    function testGetMetricsFeeConfiguration() public view {
        BondingCurveViewV5.AgentMetrics memory metrics = curveView.getMetrics(AGENT_ID);
        
        // Default fee configuration from BondingCurveV5
        assertEq(metrics.buyFeeBps, 500, "Buy fee should be 5%");
        assertEq(metrics.sellFeeBps, 500, "Sell fee should be 5%");
        assertEq(metrics.creatorFeeBps, 4000, "Creator fee should be 40%");
        assertEq(metrics.platformFeeBps, 4000, "Platform fee should be 40%");
        assertEq(metrics.lpFeeBps, 2000, "LP fee should be 20%");
    }
}
