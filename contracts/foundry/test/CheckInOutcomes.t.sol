// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import {CheckInOutcomes} from "../src/CheckInOutcomes.sol";
import {IRandom} from "../src/interfaces/IRandom.sol";
import {Random} from "../src/Random.sol";

contract CheckInOutcomesTest is Test {
    CheckInOutcomes public checkInOutcomes;
    Random public random;

    address public outcomesAdmin = address(0x123);

    function setUp() public {
        random = new Random(outcomesAdmin);
        checkInOutcomes = new CheckInOutcomes(outcomesAdmin, address(random));
    }

    function test_getOutcome() public {
        vm.startPrank(outcomesAdmin);
        uint256 drand = 0x0b27f1a680779ba30dd11fda148de333b3afbc27d277183f582ab63837e6e0d5;
        random.setRandom(drand);
        int256 outcome = checkInOutcomes.getOutcome(address(this));
        assertEq(outcome, -5);

        drand = 0x4b67a092ecec37b2ed406437bdee83caed99270a4f4c00a8980b815c87446888;
        random.setRandom(drand);
        outcome = checkInOutcomes.getOutcome(address(this));
        assertEq(outcome, 21);

        drand = 0xb7f53c6c81922d41fb7c1abfee3aa25eb17dd553bddb3eaffedbef694a6839c0;
        random.setRandom(drand);
        outcome = checkInOutcomes.getOutcome(address(this));
        assertEq(outcome, -19);

        drand = 0x6f473c503923780c92ff4fb720459656488e937f08ee8430e341f8404220bcdd;
        random.setRandom(drand);
        outcome = checkInOutcomes.getOutcome(address(this));
        assertEq(outcome, 20);

        drand = 0x4e2697570edb4eab56f2a805a39c3b29a0c3e5fbc73cc93d11356bbb87a66b81;
        random.setRandom(drand);
        outcome = checkInOutcomes.getOutcome(address(this));
        assertEq(outcome, 16);
        vm.stopPrank();
    }

    function test_setConfiguration() public {
        vm.prank(outcomesAdmin);

        vm.expectEmit(true, true, true, true);
        emit CheckInOutcomes.ConfigurationUpdated(10, 20000, 1000000);

        checkInOutcomes.setConfiguration(10, 20000, 1000000);
        assertEq(checkInOutcomes.OUTCOME_RANGE(), 10);
        assertEq(checkInOutcomes.DISQUALIFICATION_CHANCE(), 20000);
        assertEq(checkInOutcomes.PRECISION(), 1000000);
    }

    function test_setConfiguration_onlyOutcomesAdmin() public {
        vm.prank(address(0x456));
        vm.expectRevert(bytes("Caller is not the outcomes admin"));
        checkInOutcomes.setConfiguration(10, 20000, 1000000);
    }

    function test_getOutcome_disqualification() public {
        vm.prank(outcomesAdmin);
        // set disqualification chance to 100%
        checkInOutcomes.setConfiguration(10, 1000000, 1000000);

        vm.prank(outcomesAdmin);
        random.setRandom(0x4e2697570edb4eab56f2a805a39c3b29a0c3e5fbc73cc93d11356bbb87a66b81);
        int256 outcome = checkInOutcomes.getOutcome(address(this));
        assertEq(outcome, 0);
    }
}
