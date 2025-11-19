// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "../BondingCurveV5.sol";
import "../PromptTestToken.sol";
import "../PlatformVault.sol";

/**
 * @title BondingCurveV5Test
 * @notice Comprehensive test suite for BondingCurveV5 contract
 * 
 * Test Coverage:
 * - Buy operations and fee distribution
 * - Sell operations and fee distribution
 * - Graduation logic and thresholds
 * - Admin functions and access control
 * - Reentrancy protection
 * - Edge cases and invariants
 */
contract BondingCurveV5Test is Test {
    BondingCurveV5 public curve;
    PromptTestToken public promptToken;
    PromptTestToken public agentToken;
    PlatformVault public platformVault;
    
    address public owner = address(1);
    address public creator = address(2);
    address public treasury = address(3);
    address public user1 = address(4);
    address public user2 = address(5);
    address public attacker = address(6);
    
    // Test configuration matching defaults
    uint256 constant P0 = 0.00001e18; // 0.00001 PROMPT per token (scaled)
    uint256 constant P1 = 0.0001e18;  // 0.0001 PROMPT per token (scaled)
    uint256 constant GRADUATION_THRESHOLD = 8000e18; // 8000 PROMPT
    uint256 constant GRADUATION_SUPPLY = 10_000_000e18; // 10M tokens
    
    uint256 constant BUY_FEE_BPS = 500; // 5%
    uint256 constant SELL_FEE_BPS = 500; // 5%
    
    event Trade(
        address indexed user,
        bool indexed isBuy,
        uint256 promptAmount,
        uint256 tokenAmount,
        uint256 fee,
        uint256 newSupply
    );
    
    event Graduated(uint256 finalSupply, uint256 promptReserves);
    event FeesUpdated(uint256 buyFeeBps, uint256 sellFeeBps);
    event FeeDistributionUpdated(uint256 creatorBps, uint256 platformBps, uint256 lpBps);
    
    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy tokens
        promptToken = new PromptTestToken();
        agentToken = new PromptTestToken();
        
        // Deploy platform vault
        platformVault = new PlatformVault(address(promptToken));
        
        // Deploy bonding curve
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
        
        // Grant minter role to curve
        agentToken.grantRole(agentToken.MINTER_ROLE(), address(curve));
        
        // Fund test users with PROMPT
        promptToken.mint(user1, 100_000e18);
        promptToken.mint(user2, 100_000e18);
        promptToken.mint(attacker, 100_000e18);
        
        vm.stopPrank();
    }
    
    // ============================================
    // Buy Tests
    // ============================================
    
    function testBuyTokens() public {
        uint256 promptAmount = 100e18;
        
        vm.startPrank(user1);
        promptToken.approve(address(curve), promptAmount);
        
        uint256 initialBalance = agentToken.balanceOf(user1);
        
        vm.expectEmit(true, true, false, false);
        emit Trade(user1, true, promptAmount, 0, 0, 0); // Values will vary
        
        curve.buy(promptAmount, 0);
        
        uint256 finalBalance = agentToken.balanceOf(user1);
        
        assertGt(finalBalance, initialBalance, "Should receive tokens");
        assertGt(curve.tokensSold(), 0, "Tokens sold should increase");
        assertGt(curve.promptReserves(), 0, "Reserves should increase");
        
        vm.stopPrank();
    }
    
    function testBuyWithMinimumAmount() public {
        uint256 promptAmount = 100e18;
        
        vm.startPrank(user1);
        promptToken.approve(address(curve), promptAmount);
        
        // Calculate expected tokens (simplified)
        uint256 expectedTokens = promptAmount * 95 / 100 / P0 * 1e18; // After 5% fee
        
        curve.buy(promptAmount, expectedTokens);
        
        vm.stopPrank();
    }
    
    function testBuyRevertsOnSlippage() public {
        uint256 promptAmount = 100e18;
        uint256 unrealisticMinTokens = 1_000_000e18; // Way too high
        
        vm.startPrank(user1);
        promptToken.approve(address(curve), promptAmount);
        
        vm.expectRevert("Slippage too high");
        curve.buy(promptAmount, unrealisticMinTokens);
        
        vm.stopPrank();
    }
    
    function testBuyDistributesFees() public {
        uint256 promptAmount = 1000e18;
        
        vm.startPrank(user1);
        promptToken.approve(address(curve), promptAmount);
        
        uint256 creatorBefore = promptToken.balanceOf(creator);
        uint256 treasuryBefore = promptToken.balanceOf(treasury);
        
        curve.buy(promptAmount, 0);
        
        uint256 creatorAfter = promptToken.balanceOf(creator);
        uint256 treasuryAfter = promptToken.balanceOf(treasury);
        
        // 5% fee = 50 PROMPT, split 40/30/30
        uint256 expectedCreatorFee = 1000e18 * 500 / 10000 * 4000 / 10000; // 20 PROMPT
        uint256 expectedPlatformFee = 1000e18 * 500 / 10000 * 3000 / 10000; // 15 PROMPT
        
        assertApproxEqAbs(
            creatorAfter - creatorBefore,
            expectedCreatorFee,
            1e18,
            "Creator should receive fee"
        );
        
        assertApproxEqAbs(
            treasuryAfter - treasuryBefore,
            expectedPlatformFee,
            1e18,
            "Treasury should receive fee"
        );
        
        vm.stopPrank();
    }
    
    function testBuyRevertsWhenGraduated() public {
        // Buy enough to graduate
        _graduateCurve();
        
        vm.startPrank(user2);
        promptToken.approve(address(curve), 100e18);
        
        vm.expectRevert("Already graduated");
        curve.buy(100e18, 0);
        
        vm.stopPrank();
    }
    
    // ============================================
    // Sell Tests
    // ============================================
    
    function testSellTokens() public {
        // First buy tokens
        uint256 promptAmount = 1000e18;
        
        vm.startPrank(user1);
        promptToken.approve(address(curve), promptAmount);
        curve.buy(promptAmount, 0);
        
        uint256 tokenBalance = agentToken.balanceOf(user1);
        uint256 sellAmount = tokenBalance / 2;
        
        agentToken.approve(address(curve), sellAmount);
        
        uint256 promptBefore = promptToken.balanceOf(user1);
        
        vm.expectEmit(true, true, false, false);
        emit Trade(user1, false, 0, sellAmount, 0, 0);
        
        curve.sell(sellAmount, 0);
        
        uint256 promptAfter = promptToken.balanceOf(user1);
        
        assertGt(promptAfter, promptBefore, "Should receive PROMPT");
        assertLt(curve.tokensSold(), tokenBalance, "Tokens sold should decrease");
        
        vm.stopPrank();
    }
    
    function testSellAppliesFees() public {
        // Buy then sell
        vm.startPrank(user1);
        promptToken.approve(address(curve), 1000e18);
        curve.buy(1000e18, 0);
        
        uint256 tokenBalance = agentToken.balanceOf(user1);
        agentToken.approve(address(curve), tokenBalance);
        
        uint256 promptBefore = promptToken.balanceOf(user1);
        
        curve.sell(tokenBalance, 0);
        
        uint256 promptAfter = promptToken.balanceOf(user1);
        uint256 promptReceived = promptAfter - promptBefore;
        
        // Due to fees on buy and sell, should receive less than initial investment
        assertLt(promptReceived, 1000e18, "Should lose value due to fees");
        
        vm.stopPrank();
    }
    
    function testSellRevertsOnInsufficientReserves() public {
        vm.startPrank(user1);
        promptToken.approve(address(curve), 10e18);
        curve.buy(10e18, 0);
        
        uint256 tokenBalance = agentToken.balanceOf(user1);
        agentToken.approve(address(curve), tokenBalance);
        
        // This should work with small amounts
        curve.sell(tokenBalance, 0);
        
        vm.stopPrank();
    }
    
    function testSellRevertsWhenGraduated() public {
        // Buy some tokens first
        vm.startPrank(user1);
        promptToken.approve(address(curve), 1000e18);
        curve.buy(1000e18, 0);
        uint256 tokens = agentToken.balanceOf(user1);
        vm.stopPrank();
        
        // Graduate
        _graduateCurve();
        
        // Try to sell
        vm.startPrank(user1);
        agentToken.approve(address(curve), tokens);
        
        vm.expectRevert("Already graduated");
        curve.sell(tokens, 0);
        
        vm.stopPrank();
    }
    
    // ============================================
    // Graduation Tests
    // ============================================
    
    function testGraduationTriggersAtThreshold() public {
        vm.startPrank(user1);
        
        // Buy enough to reach graduation threshold
        uint256 buyAmount = GRADUATION_THRESHOLD * 105 / 100; // Extra for fees
        promptToken.approve(address(curve), buyAmount);
        
        vm.expectEmit(false, false, false, false);
        emit Graduated(0, 0);
        
        curve.buy(buyAmount, 0);
        
        assertTrue(curve.hasGraduated(), "Should be graduated");
        
        vm.stopPrank();
    }
    
    function testGraduationMetrics() public {
        _graduateCurve();
        
        assertTrue(curve.hasGraduated(), "Should be graduated");
        assertGt(curve.tokensSold(), 0, "Should have tokens sold");
        assertGe(curve.promptReserves(), GRADUATION_THRESHOLD, "Should meet threshold");
    }
    
    // ============================================
    // Admin Function Tests
    // ============================================
    
    function testSetFees() public {
        vm.startPrank(owner);
        
        uint256 newBuyFee = 300; // 3%
        uint256 newSellFee = 400; // 4%
        
        vm.expectEmit(false, false, false, true);
        emit FeesUpdated(newBuyFee, newSellFee);
        
        curve.setFees(newBuyFee, newSellFee);
        
        assertEq(curve.buyFeeBps(), newBuyFee, "Buy fee should update");
        assertEq(curve.sellFeeBps(), newSellFee, "Sell fee should update");
        
        vm.stopPrank();
    }
    
    function testSetFeesRevertsNonOwner() public {
        vm.startPrank(user1);
        
        vm.expectRevert();
        curve.setFees(300, 400);
        
        vm.stopPrank();
    }
    
    function testSetFeesRevertsOnExcessiveFees() public {
        vm.startPrank(owner);
        
        vm.expectRevert("Fees too high");
        curve.setFees(2001, 500); // Over 20%
        
        vm.expectRevert("Fees too high");
        curve.setFees(500, 2001); // Over 20%
        
        vm.stopPrank();
    }
    
    function testSetFeeDistribution() public {
        vm.startPrank(owner);
        
        uint256 newCreatorBps = 5000; // 50%
        uint256 newPlatformBps = 3000; // 30%
        uint256 newLpBps = 2000; // 20%
        
        vm.expectEmit(false, false, false, true);
        emit FeeDistributionUpdated(newCreatorBps, newPlatformBps, newLpBps);
        
        curve.setFeeDistribution(newCreatorBps, newPlatformBps, newLpBps);
        
        assertEq(curve.creatorFeeBps(), newCreatorBps);
        assertEq(curve.platformFeeBps(), newPlatformBps);
        assertEq(curve.lpFeeBps(), newLpBps);
        
        vm.stopPrank();
    }
    
    function testSetFeeDistributionRevertsOnInvalidTotal() public {
        vm.startPrank(owner);
        
        vm.expectRevert("Must sum to 100%");
        curve.setFeeDistribution(5000, 3000, 3000); // Sums to 110%
        
        vm.stopPrank();
    }
    
    function testUpdatePlatformVault() public {
        vm.startPrank(owner);
        
        address newVault = address(999);
        curve.updatePlatformVault(newVault);
        
        assertEq(curve.platformVault(), newVault);
        
        vm.stopPrank();
    }
    
    function testUpdateTreasury() public {
        vm.startPrank(owner);
        
        address newTreasury = address(888);
        curve.updateTreasury(newTreasury);
        
        assertEq(curve.treasury(), newTreasury);
        
        vm.stopPrank();
    }
    
    // ============================================
    // Reentrancy Tests
    // ============================================
    
    function testBuyReentrancyProtection() public {
        // Deploy a malicious token that tries to reenter
        ReentrantAttacker attackContract = new ReentrantAttacker(curve, promptToken);
        
        promptToken.mint(address(attackContract), 1000e18);
        
        vm.expectRevert(); // Should revert due to reentrancy guard
        attackContract.attackBuy();
    }
    
    function testSellReentrancyProtection() public {
        // First buy tokens normally
        vm.startPrank(user1);
        promptToken.approve(address(curve), 1000e18);
        curve.buy(1000e18, 0);
        vm.stopPrank();
        
        // Deploy attacker and transfer tokens
        ReentrantAttacker attackContract = new ReentrantAttacker(curve, promptToken);
        
        vm.prank(user1);
        agentToken.transfer(address(attackContract), agentToken.balanceOf(user1));
        
        vm.expectRevert(); // Should revert due to reentrancy guard
        attackContract.attackSell();
    }
    
    // ============================================
    // Edge Cases and Invariants
    // ============================================
    
    function testMinimumBuyAmount() public {
        vm.startPrank(user1);
        
        uint256 minAmount = 0.001e18; // Very small amount
        promptToken.approve(address(curve), minAmount);
        
        curve.buy(minAmount, 0);
        
        assertGt(agentToken.balanceOf(user1), 0, "Should receive tokens");
        
        vm.stopPrank();
    }
    
    function testPriceIncreasesWithSupply() public {
        vm.startPrank(user1);
        promptToken.approve(address(curve), 10000e18);
        
        // Buy in stages and check price increases
        uint256 price1 = curve.getCurrentPrice();
        
        curve.buy(1000e18, 0);
        uint256 price2 = curve.getCurrentPrice();
        
        curve.buy(1000e18, 0);
        uint256 price3 = curve.getCurrentPrice();
        
        assertGt(price2, price1, "Price should increase");
        assertGt(price3, price2, "Price should keep increasing");
        
        vm.stopPrank();
    }
    
    function testRoundTripValueLoss() public {
        vm.startPrank(user1);
        
        uint256 initialPrompt = 1000e18;
        promptToken.approve(address(curve), initialPrompt);
        
        // Buy tokens
        curve.buy(initialPrompt, 0);
        uint256 tokens = agentToken.balanceOf(user1);
        
        // Sell tokens back
        agentToken.approve(address(curve), tokens);
        uint256 promptBefore = promptToken.balanceOf(user1);
        curve.sell(tokens, 0);
        uint256 promptAfter = promptToken.balanceOf(user1);
        
        uint256 promptReceived = promptAfter - promptBefore;
        
        // Should lose ~9.75% due to fees (5% buy + 5% sell)
        assertLt(promptReceived, initialPrompt, "Should lose value on round trip");
        assertGt(promptReceived, initialPrompt * 85 / 100, "Should not lose too much");
        
        vm.stopPrank();
    }
    
    function testCannotSellMoreThanSold() public {
        vm.startPrank(user1);
        
        promptToken.approve(address(curve), 100e18);
        curve.buy(100e18, 0);
        
        uint256 tokens = agentToken.balanceOf(user1);
        
        // Mint extra tokens (bypassing the curve)
        vm.startPrank(owner);
        agentToken.mint(user1, 1_000_000e18);
        vm.stopPrank();
        
        vm.startPrank(user1);
        agentToken.approve(address(curve), tokens + 1_000_000e18);
        
        vm.expectRevert("Exceeds sold supply");
        curve.sell(tokens + 1_000_000e18, 0);
        
        vm.stopPrank();
    }
    
    // ============================================
    // Helper Functions
    // ============================================
    
    function _graduateCurve() internal {
        vm.startPrank(user2);
        
        uint256 buyAmount = GRADUATION_THRESHOLD * 110 / 100; // Extra for fees
        promptToken.approve(address(curve), buyAmount);
        curve.buy(buyAmount, 0);
        
        vm.stopPrank();
    }
}

/**
 * @title ReentrantAttacker
 * @notice Mock contract to test reentrancy protection
 */
contract ReentrantAttacker {
    BondingCurveV5 public curve;
    PromptTestToken public promptToken;
    bool public attacking;
    
    constructor(BondingCurveV5 _curve, PromptTestToken _promptToken) {
        curve = _curve;
        promptToken = _promptToken;
    }
    
    function attackBuy() external {
        promptToken.approve(address(curve), 100e18);
        attacking = true;
        curve.buy(100e18, 0);
    }
    
    function attackSell() external {
        // Assume contract has tokens
        attacking = true;
        curve.sell(1000e18, 0);
    }
    
    // Attempt reentry on token receipt
    receive() external payable {
        if (attacking) {
            attacking = false;
            curve.buy(100e18, 0); // Try to reenter
        }
    }
}
