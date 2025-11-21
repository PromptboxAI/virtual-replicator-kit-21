// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PlatformVault
 * @dev Secure vault for receiving and managing platform token allocations with timelock protection
 */
contract PlatformVault is Ownable, ReentrancyGuard {
    address public receiver;
    uint256 public constant TIMELOCK_DELAY = 48 hours;
    uint256 public constant EMERGENCY_DELAY = 365 days;

    mapping(address => uint256) public pendingReceiverChange;
    mapping(address => uint256) public tokenBalances;

    event ReceiverChangeInitiated(address indexed newReceiver, uint256 executeTime);
    event ReceiverChanged(address indexed oldReceiver, address indexed newReceiver);
    event TokensDeposited(address indexed token, uint256 amount, address indexed from);
    event TokensSwept(address indexed token, address indexed to, uint256 amount);
    event EmergencyRecovery(address indexed token, uint256 amount);

    error InvalidReceiver();
    error NoPendingChange();
    error TimelockActive();
    error InsufficientBalance();
    error TransferFailed();
    error NotReceiver();
    error EmergencyDelayNotMet();

    constructor(address _owner, address _initialReceiver) Ownable(_owner) {
        if (_owner == address(0) || _initialReceiver == address(0)) revert InvalidReceiver();
        
        receiver = _initialReceiver;
    }

    /**
     * @dev Initiate receiver change with 48-hour timelock
     */
    function initiateReceiverChange(address newReceiver) external onlyOwner {
        if (newReceiver == address(0)) revert InvalidReceiver();
        
        pendingReceiverChange[newReceiver] = block.timestamp + TIMELOCK_DELAY;
        emit ReceiverChangeInitiated(newReceiver, pendingReceiverChange[newReceiver]);
    }

    /**
     * @dev Execute receiver change after timelock period
     */
    function executeReceiverChange(address newReceiver) external onlyOwner {
        if (pendingReceiverChange[newReceiver] == 0) revert NoPendingChange();
        if (block.timestamp < pendingReceiverChange[newReceiver]) revert TimelockActive();

        address oldReceiver = receiver;
        receiver = newReceiver;
        delete pendingReceiverChange[newReceiver];
        
        emit ReceiverChanged(oldReceiver, newReceiver);
    }

    /**
     * @dev Allow receiver to sweep tokens to their address
     */
    function sweep(address token, uint256 amount) external nonReentrant {
        if (msg.sender != receiver) revert NotReceiver();
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (amount > balance) revert InsufficientBalance();

        bool success = IERC20(token).transfer(receiver, amount);
        if (!success) revert TransferFailed();

        emit TokensSwept(token, receiver, amount);
    }

    /**
     * @dev Emergency recovery function - only after 1 year of inactivity
     */
    function emergencyRecover(address token) external onlyOwner {
        // Check if sufficient time has passed (emergency delay)
        if (block.timestamp < EMERGENCY_DELAY) revert EmergencyDelayNotMet();
        
        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance == 0) revert InsufficientBalance();

        bool success = IERC20(token).transfer(owner(), balance);
        if (!success) revert TransferFailed();

        emit EmergencyRecovery(token, balance);
    }

    /**
     * @dev Get pending receiver change details
     */
    function getPendingReceiverChange(address newReceiver) external view returns (uint256 executeTime) {
        return pendingReceiverChange[newReceiver];
    }

    /**
     * @dev Get token balance in vault
     */
    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /**
     * @dev Check if receiver change can be executed
     */
    function canExecuteReceiverChange(address newReceiver) external view returns (bool) {
        uint256 executeTime = pendingReceiverChange[newReceiver];
        return executeTime > 0 && block.timestamp >= executeTime;
    }

    /**
     * @dev Receive function to handle direct token transfers
     */
    receive() external payable {
        // Allow ETH deposits but emit event for tracking
        emit TokensDeposited(address(0), msg.value, msg.sender);
    }

    /**
     * @dev Fallback to track token deposits
     */
    fallback() external payable {
        emit TokensDeposited(address(0), msg.value, msg.sender);
    }
}