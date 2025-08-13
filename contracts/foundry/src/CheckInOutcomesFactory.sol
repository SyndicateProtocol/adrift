// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {CheckInOutcomes} from "./CheckInOutcomes.sol";
import {Random} from "./Random.sol";

// TODO: Update this to take in different outcome values as parameters
contract CheckInOutcomesFactory {
    event CheckInOutcomesCreated(address indexed checkInOutcomes, address indexed randomness);

    function create(address outcomesAdmin, address randomness) public returns (CheckInOutcomes) {
        CheckInOutcomes checkInOutcomes = new CheckInOutcomes(outcomesAdmin, randomness);
        emit CheckInOutcomesCreated(address(checkInOutcomes), randomness);
        return checkInOutcomes;
    }

    function createWithRandom(address outcomesAdmin, address randomAdmin) public returns (CheckInOutcomes, Random) {
        Random random = new Random(randomAdmin);
        CheckInOutcomes checkInOutcomes = new CheckInOutcomes(outcomesAdmin, address(random));
        emit CheckInOutcomesCreated(address(checkInOutcomes), address(random));
        return (checkInOutcomes, random);
    }
}
