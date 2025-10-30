// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract PromptTestToken is ERC20 {
    constructor() ERC20("Prompt Test Token", "PROMPT") {
        // mint 1B tokens with 18 decimals to the deployer
        _mint(msg.sender, 1_000_000_000 ether);
    }
}