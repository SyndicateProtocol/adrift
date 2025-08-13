// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Adrift} from "./Adrift.sol";
import {AdriftForever} from "./AdriftForever.sol";

contract AdriftFactory {
    event AdriftCreated(address indexed gameAddress, address indexed checkInOutcomes, address indexed gameAdmin);

    function create(address gameAdmin, address checkInOutcomes) public returns (Adrift) {
        Adrift game = new Adrift(gameAdmin, checkInOutcomes);

        emit AdriftCreated(address(game), checkInOutcomes, gameAdmin);

        return game;
    }

    function createForever(address gameAdmin, address checkInOutcomes) public returns (AdriftForever) {
        AdriftForever game = new AdriftForever(gameAdmin, checkInOutcomes);

        emit AdriftCreated(address(game), checkInOutcomes, gameAdmin);

        return game;
    }
}
