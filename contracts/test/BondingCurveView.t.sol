// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../BondingCurveV5.sol";
import "../BondingCurveViewV5.sol";
import "../PromptTestToken.sol";
import "../PlatformVault.sol";

/**
 * @title BondingCurveViewTest
 * @notice Tests for the BondingCurveViewV5 read-only helper contract
 */
contract BondingCurveViewTest is Test {
    BondingCurveV5 public curve;
    BondingCurveViewV5 public view;
    PromptTestToken public promptToken;
    PromptTestToken public agentToken;
    PlatformVault public platformVault;
    
    address public owner = address(1);
    address public creator = address(2);
    address public treasury = address(3);
    address public user = address(4);
    
    uint256 constant P0 = 0.00001e18;
    uint256 constant P1 = 0.0001e18;
    uint256 constant GRADUATION_THRESHOLD = 8000e18;
    
    function setUp() public {
        vm.startPrank(owner);
        
        promptToken = new PromptTestToken();
        agentToken = new PromptTestToken();
        platformVault = new PlatformVault(address(promptToken));
        
        curve = new BondingCurveV5(
            address(agentToken),
            address(promptToken),
            creator,
            address(platformVault),
            treasury,
            P0,
            P1,
            GRADUATION_THRESHOLD
        );
        
        view = new BondingCurveViewV5();
        
        agentToken.grantRole(agentToken.MINTER_ROLE(), address(curve));
        promptToken.mint(user, 100_000e18);
        
        vm.stopPrank();
    }
    
    function testGetMetricsInitialState() public view {
        (
            uint256 tokensSold,
            uint256 promptReserves,
            uint256 currentPrice,
            uint256 marketCap,
            uint256 graduationProgress,
            bool hasGraduated
        ) = view.getMetrics(address(curve));
        
        assertEq(tokensSold, 0, "Initial tokens sold should be 0");
        assertEq(promptReserves, 0, "Initial reserves should be 0");
        assertEq(currentPrice, P0, "Initial price should be P0");
        assertEq(marketCap, 0, "Initial market cap should be 0");
        assertEq(graduationProgress, 0, "Initial progress should be 0");
        assertFalse(hasGraduated, "Should not be graduated");
    }
    
    function testGetMetricsAfterBuy() public {
        vm.startPrank(user);
        promptToken.approve(address(curve), 1000e18);
        curve.buy(1000e18, 0);
        vm.stopPrank();
        
        (
            uint256 tokensSold,
            uint256 promptReserves,
            uint256 currentPrice,
            uint256 marketCap,
            uint256 graduationProgress,
            bool hasGraduated
        ) = view.getMetrics(address(curve));
        
        assertGt(tokensSold, 0, "Should have tokens sold");
        assertGt(promptReserves, 0, "Should have reserves");
        assertGt(currentPrice, P0, "Price should increase");
        assertGt(marketCap, 0, "Market cap should be positive");
        assertGt(graduationProgress, 0, "Should have some progress");
        assertFalse(hasGraduated, "Should not be graduated yet");
    }
    
    function testGetMetricsAtGraduation() public {
        // Buy enough to graduate
        vm.startPrank(user);
        uint256 buyAmount = GRADUATION_THRESHOLD * 110 / 100;
        promptToken.approve(address(curve), buyAmount);
        curve.buy(buyAmount, 0);
        vm.stopPrank();
        
        (
            ,
            uint256 promptReserves,
            ,
            ,
            uint256 graduationProgress,
            bool hasGraduated
        ) = view.getMetrics(address(curve));
        
        assertGe(promptReserves, GRADUATION_THRESHOLD, "Should meet threshold");
        assertEq(graduationProgress, 10000, "Should be 100% (10000 bps)");
        assertTrue(hasGraduated, "Should be graduated");
    }
    
    function testCalculateBuyReturn() public view {
        uint256 promptIn = 1000e18;
        
        (uint256 tokensOut, uint256 fee) = view.calculateBuyReturn(
            address(curve),
            promptIn
        );
        
        assertGt(tokensOut, 0, "Should return tokens");
        assertEq(fee, promptIn * 500 / 10000, "Fee should be 5%");
    }
    
    function testCalculateSellReturn() public {
        // First buy tokens
        vm.startPrank(user);
        promptToken.approve(address(curve), 1000e18);
        curve.buy(1000e18, 0);
        vm.stopPrank();
        
        uint256 tokensToSell = 1000e18;
        
        (uint256 promptOut, uint256 fee) = view.calculateSellReturn(
            address(curve),
            tokensToSell
        );
        
        assertGt(promptOut, 0, "Should return PROMPT");
        assertGt(fee, 0, "Should have fee");
    }
}
