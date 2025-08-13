// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test, console} from "forge-std/Test.sol";
import {Adrift} from "../src/Adrift.sol";
import {IRandom} from "../src/interfaces/IRandom.sol";
import {Random} from "../src/Random.sol";
import {CheckInOutcomes} from "../src/CheckInOutcomes.sol";

contract AdriftTest is Test {
    Adrift public game;
    Random public random;
    CheckInOutcomes public checkInOutcomes;

    address public gameAdmin = address(0x123);

    function setUp() public {
        random = new Random(address(this));
        random.setRandom(0x0da1bbac81860f4f7159f6895834e54007dde082397bf11b21d259da91ea399c);
        checkInOutcomes = new CheckInOutcomes(gameAdmin, address(random));
        game = new Adrift(gameAdmin, address(checkInOutcomes));
    }

    function test_isGameActive() public view {
        assertFalse(game.isGameActive());
    }

    function test_register() public {
        address[] memory players = getPlayers(5);
        registerPlayers(players);

        assertEq(game.playerCount(), players.length);
        for (uint256 i = 0; i < players.length; i++) {
            assertTrue(game.isPlayerActive(players[i]));
        }
    }

    function test_registerAndCheckIn() public {
        address[] memory players = getPlayers(2);
        registerPlayers(players);
        setGameStartTime(block.timestamp + 1 hours);

        vm.warp(block.timestamp + 2 hours);
        assertTrue(game.isGameActive());

        checkInPlayer(players[0]);
    }

    function test_disqualify() public {
        address[] memory players = getPlayers(5);
        registerPlayers(players);
        uint256 gameStartTime = block.timestamp + 1 minutes;
        setGameStartTime(gameStartTime);

        address player1 = players[0];

        vm.warp(gameStartTime + 1 minutes);
        checkInPlayer(player1);
        uint256 player1NextCheckInTime = game.getNextCheckInTime(player1);

        // User cannot check in if they have missed their check-in time
        vm.warp(player1NextCheckInTime + 1 seconds);
        vm.expectRevert("Player is not active");
        vm.prank(player1);
        game.checkIn();

        vm.expectEmit(true, true, true, true);
        emit Adrift.PlayerDisqualified(player1, block.timestamp, player1NextCheckInTime, game.playerCount() - 1);
        game.disqualifyInactivePlayer(player1);

        assertEq(game.playerCount(), players.length - 1);
        assertFalse(game.isPlayerActive(player1));
    }

    function test_checkInWithinGracePeriod() public {
        address[] memory players = getPlayers(2);
        registerPlayers(players);
        uint256 gameStartTime = block.timestamp + 1 minutes;
        setGameStartTime(gameStartTime);

        address player = players[0];
        vm.warp(gameStartTime);

        uint256 playerNextCheckInTime = game.getNextCheckInTime(player);
        uint256 blockTimeWithinGracePeriod = playerNextCheckInTime - (game.CHECKIN_GRACE_PERIOD() / 2);

        vm.warp(blockTimeWithinGracePeriod);
        checkInPlayer(player);
        playerNextCheckInTime = game.getNextCheckInTime(player);

        // Make sure the next check-in time is within the expected range
        uint256 expectedMinTime = block.timestamp;
        uint256 expectedMaxTime =
            block.timestamp + (game.checkInOutcomes().OUTCOME_RANGE() * 1 hours + game.CHECKIN_INTERVAL());

        assertTrue(
            playerNextCheckInTime >= expectedMinTime && playerNextCheckInTime <= expectedMaxTime,
            "Next check-in time should be within OUTCOME_RANGE"
        );
        assertEq(game.checkInsBeforeGracePeriod(player), 0);
    }

    function test_checkInOutsideGracePeriod() public {
        address[] memory players = getPlayers(2);
        registerPlayers(players);
        uint256 gameStartTime = block.timestamp + 1 minutes;
        setGameStartTime(gameStartTime);

        address player = players[0];
        vm.warp(gameStartTime);

        uint256 playerNextCheckInTime = game.getNextCheckInTime(player);
        uint256 blockTimeBeforeGracePeriod = playerNextCheckInTime - (game.CHECKIN_GRACE_PERIOD() + 1 hours);

        // Player was allowed to check in 6 times before the grace period before getting disqualified
        for (uint256 i = 0; i < 6; i++) {
            vm.warp(blockTimeBeforeGracePeriod + (i * 1 seconds));
            checkInPlayer(player);
            playerNextCheckInTime = game.getNextCheckInTime(player);
            assertEq(game.checkInsBeforeGracePeriod(player), i + 1);
        }

        vm.expectEmit(true, true, false, false);
        emit Adrift.PlayerCheckedIn(player, block.timestamp, 0, game.CHECKIN_DISQUALIFIED(), true);
        vm.expectEmit(true, false, false, true);
        emit Adrift.PlayerDisqualified(player, block.timestamp, block.timestamp, game.playerCount() - 1);
        vm.prank(player);
        game.checkIn();

        assertEq(game.playerCount(), players.length - 1);
        assertFalse(game.isPlayerActive(player));
    }

    function test_receive() public {
        uint256 initialBalance = address(game).balance;
        uint256 amountToSend = 1 ether;
        (bool success,) = address(game).call{value: amountToSend}("");
        assertTrue(success);
        assertEq(address(game).balance, initialBalance + amountToSend);
    }

    function test_setGracePeriod() public {
        uint256 gracePeriod = 1 hours;
        vm.expectEmit(true, false, false, true);
        emit Adrift.GracePeriodSet(gracePeriod);
        vm.prank(gameAdmin);
        game.setGracePeriod(gracePeriod);
    }

    function test_setMaxNextCheckInOutsideGracePeriod() public {
        uint256 maxNextCheckInOutsideGracePeriod = 1 hours;
        vm.expectEmit(true, false, false, true);
        emit Adrift.MaxNextCheckInOutsideGracePeriodSet(maxNextCheckInOutsideGracePeriod);
        vm.prank(gameAdmin);
        game.setMaxNextCheckInOutsideGracePeriod(maxNextCheckInOutsideGracePeriod);
    }

    function registerPlayers(address[] memory players) internal {
        uint256 totalRegistrationCost = players.length * game.REGISTRATION_GAS();
        (bool success,) = address(game).call{value: totalRegistrationCost}("");
        assertTrue(success, "Failed to fund contract");
        for (uint256 i = 0; i < players.length; i++) {
            uint256 playerBalanceBefore = players[i].balance;
            vm.expectEmit(true, true, false, true);
            emit Adrift.PlayerRegistered(players[i], block.timestamp, game.gameStartTime() + 24 hours);
            game.register(players[i]);

            // Verify the player received the registration gas
            assertEq(players[i].balance, playerBalanceBefore + game.REGISTRATION_GAS());
        }
    }

    function getPlayers(uint256 count) internal returns (address[] memory) {
        address[] memory players = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            players[i] = makeAddr(string(abi.encodePacked("player", vm.toString(i))));
        }
        return players;
    }

    function setGameStartTime(uint256 gameStartTime) internal {
        vm.expectEmit(true, false, false, true);
        emit Adrift.GameStartTimeSet(gameStartTime);
        vm.prank(gameAdmin);
        game.setGameStartTime(gameStartTime);
    }

    function checkInPlayer(address player) internal returns (uint256 nextCheckInTime) {
        vm.prank(player);
        vm.expectEmit(true, true, false, false);
        emit Adrift.PlayerCheckedIn(player, block.timestamp, 0, block.timestamp + 1 hours, false);
        game.checkIn();
        return game.getNextCheckInTime(player);
    }
}
