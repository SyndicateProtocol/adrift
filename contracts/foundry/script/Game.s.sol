// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Adrift} from "../src/Adrift.sol";
import {AdriftFactory} from "../src/AdriftFactory.sol";
import {CheckInOutcomesFactory} from "../src/CheckInOutcomesFactory.sol";
import {Random} from "../src/Random.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {CheckInOutcomes} from "../src/CheckInOutcomes.sol";

contract CreateAdrift is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIV_KEY");
        vm.startBroadcast(privateKey);

        AdriftFactory adriftFactory = AdriftFactory(vm.envAddress("FACTORY_ADDRESS"));
        Adrift adrift = adriftFactory.create(vm.envAddress("GAME_ADMIN"), vm.envAddress("CHECK_IN_OUTCOMES_ADDRESS"));
        console.log("Adrift address", address(adrift));

        uint256 gameStartTime = block.timestamp + 10 minutes;
        adrift.setGameStartTime(gameStartTime);

        console.log("Game start time set to", gameStartTime);

        bool shouldFundContract = false;
        if (shouldFundContract) {
            uint256 amountToFundContract = 5 ether;
            uint256 senderBalance = address(msg.sender).balance;
            if (senderBalance > amountToFundContract) {
                (bool success,) = address(adrift).call{value: amountToFundContract}("");
                require(success, "Failed to send native token to Adrift");
                console.log("Sent 3 native token to Adrift at", address(adrift));
            } else {
                console.log("Insufficient balance to fund contract, skipping funding");
            }
        }

        vm.stopBroadcast();
    }
}
