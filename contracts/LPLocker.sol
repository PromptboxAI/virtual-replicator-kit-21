// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LPLocker
 * @notice Time-locks LP tokens for a specified duration
 * 
 * Key Features:
 * - Can lock any ERC-20 (LP tokens)
 * - Cannot withdraw before unlock time
 * - Only beneficiary can withdraw
 * - Query lock status
 */
contract LPLocker {
    using SafeERC20 for IERC20;
    
    struct Lock {
        address lpToken;
        uint256 amount;
        uint256 unlockTime;
        address beneficiary;
        bool withdrawn;
    }
    
    mapping(uint256 => Lock) public locks;
    uint256 public nextLockId;
    
    event Locked(
        uint256 indexed lockId,
        address indexed lpToken,
        uint256 amount,
        uint256 unlockTime,
        address indexed beneficiary
    );
    
    event Withdrawn(
        uint256 indexed lockId,
        address indexed beneficiary,
        uint256 amount
    );
    
    /**
     * @notice Lock LP tokens for a duration
     * @param lpToken LP token address
     * @param amount Amount to lock
     * @param unlockTime Timestamp when tokens can be withdrawn
     * @param beneficiary Address that can withdraw
     * @return lockId ID of the lock
     */
    function lock(
        address lpToken,
        uint256 amount,
        uint256 unlockTime,
        address beneficiary
    ) external returns (uint256 lockId) {
        require(unlockTime > block.timestamp, "Unlock time must be in future");
        require(beneficiary != address(0), "Invalid beneficiary");
        require(amount > 0, "Amount must be > 0");
        
        // Transfer LP tokens from caller
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Create lock
        lockId = nextLockId++;
        locks[lockId] = Lock({
            lpToken: lpToken,
            amount: amount,
            unlockTime: unlockTime,
            beneficiary: beneficiary,
            withdrawn: false
        });
        
        emit Locked(lockId, lpToken, amount, unlockTime, beneficiary);
        return lockId;
    }
    
    /**
     * @notice Withdraw locked tokens after unlock time
     * @param lockId ID of the lock
     */
    function withdraw(uint256 lockId) external {
        Lock storage lockInfo = locks[lockId];
        
        require(!lockInfo.withdrawn, "Already withdrawn");
        require(block.timestamp >= lockInfo.unlockTime, "Still locked");
        require(msg.sender == lockInfo.beneficiary, "Not beneficiary");
        
        uint256 amount = lockInfo.amount;
        lockInfo.withdrawn = true;
        
        IERC20(lockInfo.lpToken).safeTransfer(lockInfo.beneficiary, amount);
        
        emit Withdrawn(lockId, lockInfo.beneficiary, amount);
    }
    
    /**
     * @notice Get lock information
     * @param lockId ID of the lock
     * @return lpToken LP token address
     * @return amount Locked amount
     * @return unlockTime Unlock timestamp
     * @return beneficiary Beneficiary address
     * @return withdrawn Whether already withdrawn
     * @return timeRemaining Time until unlock (0 if already unlocked)
     */
    function getLockInfo(uint256 lockId) external view returns (
        address lpToken,
        uint256 amount,
        uint256 unlockTime,
        address beneficiary,
        bool withdrawn,
        uint256 timeRemaining
    ) {
        Lock memory lockInfo = locks[lockId];
        uint256 remaining = lockInfo.unlockTime > block.timestamp
            ? lockInfo.unlockTime - block.timestamp
            : 0;
        
        return (
            lockInfo.lpToken,
            lockInfo.amount,
            lockInfo.unlockTime,
            lockInfo.beneficiary,
            lockInfo.withdrawn,
            remaining
        );
    }
}
