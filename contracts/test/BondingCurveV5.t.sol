// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../BondingCurveV5.sol";
import "../PromptTestToken.sol";
import "../PlatformVault.sol";

contract MockAgentToken is ERC20 {
    constructor() ERC20("Mock Agent Token", "MOCK") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}

contract BondingCurveV5BasicTest is Test {
    BondingCurveV5 public curve;
    PromptTestToken public promptToken;
    MockAgentToken public agentToken;
    PlatformVault public platformVault;

    bytes32 public constant AGENT_ID = keccak256("TEST_AGENT");
    address public creator = address(2);
    address public treasury = address(3);

    function setUp() public {
        // Deploy test PROMPT token and platform vault
        promptToken = new PromptTestToken();
        platformVault = new PlatformVault(address(this), address(promptToken));

        // Deploy bonding curve, giving this test contract ownership
        curve = new BondingCurveV5(
            address(promptToken),
            address(platformVault),
            treasury,
            address(this)
        );

        // Deploy a simple mintable/burnable agent token
        agentToken = new MockAgentToken();

        // Register a single test agent
        curve.registerAgent(
            AGENT_ID,
            address(agentToken),
            creator,
            1e14,          // p0
            1e15,          // p1
            1_000e18       // graduation threshold in PROMPT
        );
    }

    function testAgentRegistered() public {
        (
            uint256 p0,
            uint256 p1,
            uint256 graduationThreshold,
            address cfgCreator,
            address cfgAgentToken
        ) = curve.agentConfigs(AGENT_ID);

        assertEq(cfgCreator, creator, "creator should match");
        assertEq(cfgAgentToken, address(agentToken), "agent token should match");
        assertEq(p0, 1e14, "p0 should match");
        assertEq(p1, 1e15, "p1 should match");
        assertEq(graduationThreshold, 1_000e18, "graduation threshold should match");
    }
}
