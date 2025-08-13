// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ICheckInOutcomes} from "./interfaces/ICheckInOutcomes.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {console} from "forge-std/console.sol";

contract Adrift is AccessControl {
    // The game admin role is used to set the gameStartTime() only. This should
    // be a small number of wallets (ideally 1) that can be used to set the
    // gameStartTime.
    bytes32 public constant GAME_ADMIN_ROLE = keccak256("GAME_ADMIN_ROLE");

    // For safety we are going to use < everywhere instead of ≤. This means that
    // the CHECKIN_INTERVAL must be under 24 hours, and checking in exactly at
    // 24 hours is invalid
    uint256 public constant CHECKIN_INTERVAL = 24 hours;

    // Registration reward amount sent to players upon registration
    uint256 public constant REGISTRATION_GAS = 1 ether;

    // The earliest a player can check in within their nextCheckIn without increasing their odds of being disqualified
    uint256 public CHECKIN_GRACE_PERIOD = 1 hours;

    // The maximum next check in time a player can get outside of the grace period
    uint256 public MAX_NEXT_CHECK_IN_OUTSIDE_GRACE_PERIOD = 4 days;

    // This value is used to initialize the nextCheckIn mapping. We use 1 rather
    // than the gameStartTime since the gameStartTime may change after registration is open
    // This lets us avoid a separate check-in initialization bool, by rolling it into the nextCheckIn mapping
    uint256 public CHECKIN_INITIALIZED = 1;
    // This value is used to indicate that a player is disqualified due to random chance or extra check-ins outside of the grace period
    uint256 public CHECKIN_DISQUALIFIED = type(uint256).max;

    // Default is set to Tue Jan 01 2030 08:00:00 GMT+0000
    // This of course should be moved to the actual launch date, but it avoids a
    // bunch of special handling where gameStartTime is 0
    uint256 public gameStartTime = 1893484800;
    // We initialize the gameEndTime to the max uint256 value to avoid needing
    // special handling where gameEndTime is 0
    uint256 public gameEndTime = type(uint256).max;
    // Note that the game can end with no winners, if everyone failed to check
    // in before the last interval
    address public winner;

    // Simple mapping to track the next check-in time for each player. We don't
    // need to track any initialization or active status -- that is all handled
    // via helper functions
    mapping(address player => uint256 nextCheckInTime) public nextCheckIn;
    mapping(address player => uint256 checkInsBeforeGracePeriod) public checkInsBeforeGracePeriod;
    mapping(address player => bool isPlayerDisqualified) public isPlayerDisqualified;
    uint256 public playerCount;

    event GameStartTimeSet(uint256 gameStartTime);
    event GameEnded(uint256 gameEndTime, address indexed winner);
    event PlayerRegistered(address indexed player, uint256 registrationTime, uint256 nextCheckInTime);
    event PlayerCheckedIn(
        address indexed player,
        uint256 checkInTime,
        int256 buffOrDebuff,
        uint256 nextCheckInTime,
        bool indexed isDisqualified
    );
    event PlayerDisqualified(
        address indexed player, uint256 disqualificationTime, uint256 lastActiveTime, uint256 playerCount
    );
    event GracePeriodSet(uint256 gracePeriod);
    event MaxNextCheckInOutsideGracePeriodSet(uint256 maxNextCheckInOutsideGracePeriod);

    ICheckInOutcomes public checkInOutcomes;

    modifier onlyGameAdmin() {
        require(hasRole(GAME_ADMIN_ROLE, msg.sender), "Caller is not the game admin");
        _;
    }

    modifier onlyBeforeGameStart() {
        require(block.timestamp < gameStartTime, "Game has already started");
        _;
    }

    modifier onlyDuringGame() {
        require(block.timestamp >= gameStartTime, "Game has not started yet");
        require(block.timestamp < gameEndTime, "Game has ended");
        _;
    }

    modifier onlyActive() {
        require(isPlayerActive(msg.sender), "Player is not active");
        _;
    }

    modifier onlyNotActive(address player) {
        require(!isPlayerActive(player), "Player is active");
        _;
    }

    constructor(address gameAdminAddress, address checkInOutcomesAddress) {
        require(gameAdminAddress != address(0), "Game admin address cannot be zero");
        require(checkInOutcomesAddress != address(0), "Check-in outcomes address cannot be zero");
        _grantRole(GAME_ADMIN_ROLE, gameAdminAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, gameAdminAddress);
        checkInOutcomes = ICheckInOutcomes(checkInOutcomesAddress);
    }

    function setGameStartTime(uint256 startTime) public onlyGameAdmin {
        gameStartTime = startTime;
        emit GameStartTimeSet(startTime);
    }

    function register(address player) public onlyBeforeGameStart {
        nextCheckIn[player] = CHECKIN_INITIALIZED;
        playerCount++;

        // Send 1 token to the player for gas if contract has sufficient balance
        if (address(this).balance >= REGISTRATION_GAS) {
            Address.sendValue(payable(player), REGISTRATION_GAS);
        }

        emit PlayerRegistered(player, block.timestamp, gameStartTime + CHECKIN_INTERVAL);
    }

    // Checkins must be performed by the msg.sender
    function checkIn() public onlyDuringGame onlyActive {
        // If everyone else is disqualified, we automatically proceed to
        // endGame(). This avoids the risk of random disqualification due to the
        // variable outcomes in cases where you have already won
        if (playerCount == 1) {
            return endGame(msg.sender);
        }

        // - If a user checks in within 1 hour of their next check in, the risk is capped to certain limits we define. They could get debuffed, but they will only have a 2% chance of getting DQ'd.
        // - If a user checks in before the 1 hour grace period, the buff range increases.
        // - If a user checks in before the 1 hour grace period multiple times, the risk compounds. The buff range grows further, increasing the likelihood the user gets DQ'd from a negative outcome, but also increases the likelihood of hitting the jackpot & letting your ship sail for a few days
        // - Checking in during the 1 hour grace period "resets" the users buff range back to the original state
        int256 outcome = checkInOutcomes.getOutcome(msg.sender);
        if (outcome == checkInOutcomes.DISQUALIFIED_OUTCOME()) {
            return disqualifyFromCheckIn(msg.sender, outcome);
        }

        uint256 nextCheckInTime;
        int256 buffOrDebuff;
        if (isWithinGracePeriod(msg.sender)) {
            // Reset the checkInsBeforeGracePeriod if the user checks in within the grace period
            if (checkInsBeforeGracePeriod[msg.sender] > 0) {
                checkInsBeforeGracePeriod[msg.sender] = 0;
            }
            buffOrDebuff = outcome * 1 hours + int256(CHECKIN_INTERVAL);
            int256 calculatedTime = int256(getNextCheckInTime(msg.sender)) + buffOrDebuff;

            // If the user gets a negative next check in time and they are within the grace period, we set the next check in time to a grace period interval of time in the future
            if (isTimeInThePast(calculatedTime)) {
                buffOrDebuff = int256(CHECKIN_GRACE_PERIOD); // This represents the grace period as a positive buff
                nextCheckInTime = block.timestamp + CHECKIN_GRACE_PERIOD;
            } else {
                nextCheckInTime = uint256(calculatedTime);
            }
        } else {
            checkInsBeforeGracePeriod[msg.sender]++;
            // Linearly increase the outcome based on the number of times they have checked in before the grace period
            buffOrDebuff = outcome * 1 hours * int256(checkInsBeforeGracePeriod[msg.sender]) + int256(CHECKIN_INTERVAL);
            int256 calculatedTime = int256(getNextCheckInTime(msg.sender)) + buffOrDebuff;
            uint256 nextCheckInMax = block.timestamp + MAX_NEXT_CHECK_IN_OUTSIDE_GRACE_PERIOD;
            if (calculatedTime > int256(nextCheckInMax)) {
                calculatedTime = int256(nextCheckInMax);
                buffOrDebuff = int256(nextCheckInMax) - int256(getNextCheckInTime(msg.sender));
            }

            if (isTimeInThePast(calculatedTime)) {
                return disqualifyFromCheckIn(msg.sender, buffOrDebuff);
            }
            nextCheckInTime = uint256(calculatedTime);
        }

        nextCheckIn[msg.sender] = nextCheckInTime;
        emit PlayerCheckedIn(msg.sender, block.timestamp, buffOrDebuff, nextCheckInTime, false);
    }

    function getNextCheckInTime(address player) public view returns (uint256) {
        uint256 nextCheckInTime = nextCheckIn[player];
        if (nextCheckInTime == CHECKIN_INITIALIZED) {
            return gameStartTime + CHECKIN_INTERVAL;
        }
        // If lastCheckIn is 0, the player has never registered
        return nextCheckInTime;
    }

    function isWithinGracePeriod(address player) public view returns (bool) {
        uint256 nextCheckInTime = getNextCheckInTime(player);
        if (nextCheckInTime <= block.timestamp) {
            return false;
        }
        return nextCheckInTime - block.timestamp <= CHECKIN_GRACE_PERIOD;
    }

    // Disqualifications can be performed by anyone. This will be automated via
    // Syndicate's Transaction Cloud
    function disqualifyInactivePlayer(address player) public onlyDuringGame onlyNotActive(player) {
        uint256 nextCheckInTime = nextCheckIn[player];
        require(nextCheckInTime != 0, "Player is not registered");
        _disqualify(player, nextCheckInTime);
    }

    function disqualifyFromCheckIn(address player, int256 buffOrDebuff) internal {
        // Set the next check-in time to CHECKIN_DISQUALIFIED to indicate that the player is disqualified & they are no longer active
        nextCheckIn[player] = CHECKIN_DISQUALIFIED;
        emit PlayerCheckedIn(player, block.timestamp, buffOrDebuff, CHECKIN_DISQUALIFIED, true);
        _disqualify(player, block.timestamp);
    }

    function _disqualify(address player, uint256 lastActiveTime) internal {
        // We don't need to manually mark a player as inactive, this is
        // automatic based on the check-in timestamp. This just reduces the
        // player count
        playerCount--;
        isPlayerDisqualified[player] = true;
        emit PlayerDisqualified(player, block.timestamp, lastActiveTime, playerCount);
    }

    // The end game conditions are:
    // 1. The game has ended, and there is one player still standing
    // 2. The game has ended, and there are no players still standing
    // In the former case, the player parameter must be the winner
    // In the latter case, any address can be passed in as the player parameter
    // if playerCount is 0
    // Note that endGame() *MUST* be called while the game is still active and the
    // winner is still valid. If the winner is no longer active, the game will
    // have zero winners
    function endGame(address player) public onlyDuringGame {
        // playerCount must be 1 or 0
        require(playerCount <= 1, "Game is not over");

        // The winner is only set if the player is still active. If no players
        // are still active, then disqualify the remaining players first to
        // ensure that playerCount is 0
        if (playerCount == 1) {
            // Check that no winner was set first
            require(winner == address(0), "Winner has already been set");

            require(
                isPlayerActive(player),
                "Player is not active. Either pass in the winner or disqualify the remaining players first"
            );
            winner = player;
        }

        // Set the game end time
        gameEndTime = block.timestamp;

        emit GameEnded(gameEndTime, winner);
    }

    function setGracePeriod(uint256 gracePeriod) public onlyGameAdmin {
        CHECKIN_GRACE_PERIOD = gracePeriod;
        emit GracePeriodSet(gracePeriod);
    }

    function setMaxNextCheckInOutsideGracePeriod(uint256 maxNextCheckInOutsideGracePeriod) public onlyGameAdmin {
        MAX_NEXT_CHECK_IN_OUTSIDE_GRACE_PERIOD = maxNextCheckInOutsideGracePeriod;
        emit MaxNextCheckInOutsideGracePeriodSet(maxNextCheckInOutsideGracePeriod);
    }

    function isPlayerActive(address player) public view returns (bool) {
        // The player is only active if they are still within their check-in
        // interval. Since this extends upon check-in, the player is always
        // considered active until their check-in window lapses. If the player
        // is disqualified, their next check-in time is set to type(uint256).max,
        // which is greater than the current block timestamp
        return block.timestamp < getNextCheckInTime(player) && nextCheckIn[player] != CHECKIN_DISQUALIFIED
            && !isPlayerDisqualified[player];
    }

    function isGameActive() public view returns (bool) {
        return gameStartTime <= block.timestamp && block.timestamp < gameEndTime;
    }

    function setCheckInOutcomes(address checkInOutcomes_) public onlyGameAdmin {
        checkInOutcomes = ICheckInOutcomes(checkInOutcomes_);
    }

    function isTimeInThePast(int256 time) internal view returns (bool) {
        return time <= int256(block.timestamp);
    }

    // For funding the contract intially. Do not send funds here.
    receive() external payable {}
}
