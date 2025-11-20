// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title LPTokenLock
 * @dev Contract to lock LP tokens for 10 years after agent graduation
 * Phase 4: Implementation of 10-year LP token lock mechanism
 */
contract LPTokenLock is ReentrancyGuard, Ownable {
    struct LockInfo {
        address tokenAddress;
        uint256 amount;
        uint256 unlockTime;
        address beneficiary;
        bool withdrawn;
    }
    
    mapping(uint256 => LockInfo) public locks;
    mapping(address => uint256[]) public userLocks;
    uint256 public nextLockId;
    
    uint256 public constant LOCK_DURATION = 10 * 365 days; // 10 years
    
    event TokensLocked(
        uint256 indexed lockId,
        address indexed tokenAddress,
        address indexed beneficiary,
        uint256 amount,
        uint256 unlockTime
    );
    
    event TokensWithdrawn(
        uint256 indexed lockId,
        address indexed beneficiary,
        uint256 amount
    );
    
    /**
     * @dev Lock LP tokens for 10 years
     * @param tokenAddress Address of the LP token contract
     * @param amount Amount of LP tokens to lock
     * @param beneficiary Address that can withdraw after unlock time
     */
    function lockTokens(
        address tokenAddress,
        uint256 amount,
        address beneficiary
    ) external nonReentrant returns (uint256 lockId) {
        require(tokenAddress != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");
        require(beneficiary != address(0), "Invalid beneficiary");
        
        // Transfer tokens to this contract
        IERC20(tokenAddress).transferFrom(msg.sender, address(this), amount);
        
        lockId = nextLockId++;
        uint256 unlockTime = block.timestamp + LOCK_DURATION;
        
        locks[lockId] = LockInfo({
            tokenAddress: tokenAddress,
            amount: amount,
            unlockTime: unlockTime,
            beneficiary: beneficiary,
            withdrawn: false
        });
        
        userLocks[beneficiary].push(lockId);
        
        emit TokensLocked(lockId, tokenAddress, beneficiary, amount, unlockTime);
        
        return lockId;
    }
    
    /**
     * @dev Withdraw locked tokens after unlock time
     * @param lockId ID of the lock to withdraw from
     */
    function withdrawTokens(uint256 lockId) external nonReentrant {
        LockInfo storage lock = locks[lockId];
        
        require(lock.beneficiary == msg.sender, "Not authorized");
        require(!lock.withdrawn, "Already withdrawn");
        require(block.timestamp >= lock.unlockTime, "Tokens still locked");
        
        lock.withdrawn = true;
        
        IERC20(lock.tokenAddress).transfer(lock.beneficiary, lock.amount);
        
        emit TokensWithdrawn(lockId, lock.beneficiary, lock.amount);
    }
    
    /**
     * @dev Get lock information
     */
    function getLockInfo(uint256 lockId) external view returns (LockInfo memory) {
        return locks[lockId];
    }
    
    /**
     * @dev Get all lock IDs for a user
     */
    function getUserLocks(address user) external view returns (uint256[] memory) {
        return userLocks[user];
    }
    
    /**
     * @dev Check if tokens can be withdrawn
     */
    function canWithdraw(uint256 lockId) external view returns (bool) {
        LockInfo memory lock = locks[lockId];
        return !lock.withdrawn && block.timestamp >= lock.unlockTime;
    }
    
    /**
     * @dev Get time remaining until unlock
     */
    function timeUntilUnlock(uint256 lockId) external view returns (uint256) {
        LockInfo memory lock = locks[lockId];
        if (block.timestamp >= lock.unlockTime) {
            return 0;
        }
        return lock.unlockTime - block.timestamp;
    }
    
    /**
     * @dev Emergency function to recover tokens (only owner, only if lock is expired by more than 1 year)
     */
    function emergencyRecovery(uint256 lockId) external onlyOwner {
        LockInfo storage lock = locks[lockId];
        require(!lock.withdrawn, "Already withdrawn");
        require(block.timestamp >= lock.unlockTime + 365 days, "Not eligible for emergency recovery");
        
        lock.withdrawn = true;
        IERC20(lock.tokenAddress).transfer(lock.beneficiary, lock.amount);
        
        emit TokensWithdrawn(lockId, lock.beneficiary, lock.amount);
    }
}