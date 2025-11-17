// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AgentTokenV5
 * @notice Simple ERC20 token that can only be minted/burned by the BondingCurveV5 contract
 * @dev Part of the V5 architecture - tokens are minted on buy, burned on sell
 */
contract AgentTokenV5 is ERC20, Ownable {
    address public bondingCurve;
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    
    event BondingCurveSet(address indexed bondingCurve);
    
    constructor(
        string memory name,
        string memory symbol,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        // Token is created but no supply is minted yet
        // Supply will be minted through the bonding curve
    }
    
    /**
     * @notice Set the bonding curve contract that can mint/burn tokens
     * @param _bondingCurve Address of the BondingCurveV5 contract
     */
    function setBondingCurve(address _bondingCurve) external onlyOwner {
        require(_bondingCurve != address(0), "Invalid bonding curve address");
        require(bondingCurve == address(0), "Bonding curve already set");
        bondingCurve = _bondingCurve;
        emit BondingCurveSet(_bondingCurve);
    }
    
    /**
     * @notice Mint tokens - only callable by bonding curve
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == bondingCurve, "Only bonding curve can mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
    
    /**
     * @notice Burn tokens - only callable by bonding curve
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external {
        require(msg.sender == bondingCurve, "Only bonding curve can burn");
        _burn(from, amount);
    }
}
