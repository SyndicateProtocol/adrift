// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {Adrift} from "../src/Adrift.sol";
import {AdriftForever} from "../src/AdriftForever.sol";
import {AdriftFactory} from "../src/AdriftFactory.sol";
import {CheckInOutcomesFactory} from "../src/CheckInOutcomesFactory.sol";
import {CheckInOutcomes} from "../src/CheckInOutcomes.sol";
import {Random} from "../src/Random.sol";
import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AdriftBundler} from "../src/sequencing/AdriftBundler.sol";
import {IAllowlistSequencingModule} from "../src/interfaces/IAllowlistSequencingModule.sol";

contract DeployAdrift is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIV_KEY");
        vm.startBroadcast(privateKey);
        // TODO: update as needed
        address admin = address(0x123);
        address checkInOutcomesAddress = address(0x456);
        new Adrift(admin, checkInOutcomesAddress);
        vm.stopBroadcast();
    }
}

contract DeployFactories is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIV_KEY");
        vm.startBroadcast(privateKey);
        address adriftFactory = address(new AdriftFactory());
        address checkInOutcomesFactory = address(new CheckInOutcomesFactory());
        console.log("AdriftFactory", adriftFactory);
        console.log("CheckInOutcomesFactory", checkInOutcomesFactory);
        vm.stopBroadcast();
    }
}

contract DeployRandom is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIV_KEY");
        address randomnessAdmin = vm.envAddress("RANDOM_ADMIN");
        vm.startBroadcast(privateKey);
        Random random = new Random(randomnessAdmin);
        console.log("Random", address(random));
        vm.stopBroadcast();
    }
}

contract DeployFactoriesAndGameForever is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIV_KEY");
        address admin = vm.addr(privateKey);
        address randomAddress = vm.envAddress("RANDOM_ADDRESS");
        vm.startBroadcast(privateKey);
        CheckInOutcomesFactory checkInOutcomesFactory = new CheckInOutcomesFactory();
        AdriftFactory adriftFactory = new AdriftFactory();
        console.log("CheckInOutcomesFactory", address(checkInOutcomesFactory));
        console.log("AdriftFactory", address(adriftFactory));

        CheckInOutcomes checkInOutcomes = checkInOutcomesFactory.create(admin, randomAddress);
        AdriftForever adriftForever = adriftFactory.createForever(admin, address(checkInOutcomes));
        console.log("CheckInOutcomes", address(checkInOutcomes));
        console.log("AdriftForever", address(adriftForever));

        uint256 gameStartTime = 1760472083;
        adriftForever.setGameStartTime(gameStartTime);
        console.log("Game started at", gameStartTime);
        vm.stopBroadcast();
    }
}

contract DeployAdriftFactoryWithCheckInOutcomes is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIV_KEY");
        address admin = vm.addr(privateKey);
        address checkInOutcomesAddress = vm.envAddress("CHECK_IN_OUTCOMES_ADDRESS");
        vm.startBroadcast(privateKey);
        AdriftFactory adriftFactory = new AdriftFactory();
        console.log("AdriftFactory", address(adriftFactory));

        Adrift adrift = adriftFactory.create(admin, checkInOutcomesAddress);
        console.log("Adrift", address(adrift), "with CheckInOutcomes", checkInOutcomesAddress);

        adrift.grantRole(adrift.GAME_ADMIN_ROLE(), 0x0f7b8B1D8c101E46c1781978f2B9310D85251f26);
        adrift.grantRole(adrift.GAME_ADMIN_ROLE(), 0x3b96a0D8EfE1a925f0f4382bC28De50d7d8a9Ff5);

        uint256 gameStartTime = 1752076800;
        adrift.setGameStartTime(gameStartTime);
        console.log("Game started at", gameStartTime);
        vm.stopBroadcast();
    }
}

contract DeployAdriftBundler is Script {
    function run() public {
        uint256 privateKey = vm.envUint("PRIV_KEY");
        address sequencingAddress = vm.envAddress("SEQUENCING_ADDRESS");
        address randomAdmin = vm.envAddress("RANDOM_ADMIN");
        address sequencerAdmin = vm.envAddress("SEQUENCER_ADMIN");

        vm.startBroadcast(privateKey);
        console.log("Creating AdriftBundler");
        console.log("Sequencing address", sequencingAddress);
        console.log("Randomness admin", randomAdmin);
        console.log("Sequencer admin", sequencerAdmin);
        AdriftBundler adriftBundler = new AdriftBundler(sequencingAddress, randomAdmin, sequencerAdmin);
        console.log("AdriftBundler", address(adriftBundler));
        vm.stopBroadcast();

        // Currently Pacifica is configured with an AllowlistSequencingModule that only allows allowlisted
        // addresses to write to the contract. We must allowlist the AdriftBundler so it can process transactions.
        vm.startBroadcast(vm.envUint("ALLOWLIST_SEQUENCING_MODULE_OWNER_PRIVATE_KEY"));
        console.log("Allowlisting AdriftBundler on SyndicateSequencingChain");
        IAllowlistSequencingModule(vm.envAddress("ALLOWLIST_SEQUENCING_MODULE_ADDRESS")).addToAllowlist(
            address(adriftBundler)
        );
        vm.stopBroadcast();
    }
}
