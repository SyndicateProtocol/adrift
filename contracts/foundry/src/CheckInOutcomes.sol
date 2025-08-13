// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IRandom} from "./interfaces/IRandom.sol";
import {ICheckInOutcomes} from "./interfaces/ICheckInOutcomes.sol";

// Determines random check-in outcomes based on sequencer-injected randomness
// Randomness nonces are checked here and outcomes are determined in this contract
contract CheckInOutcomes is AccessControl, ICheckInOutcomes {
    IRandom public immutable random;

    bytes32 public constant CHECKIN_OUTCOMES_ADMIN_ROLE = keccak256("CHECKIN_OUTCOMES_ADMIN");

    event ConfigurationUpdated(uint256 outcomeRange, uint256 disqualificationChance, uint256 precision);

    uint256 public OUTCOME_RANGE = 24;
    uint256 public DISQUALIFICATION_CHANCE = 20000; // 2% chance (20000 / PRECISION)
    uint256 public PRECISION = 1000000;
    int256 public DISQUALIFIED_OUTCOME = 0;

    mapping(address => uint256) public playerNonces;

    modifier onlyOutcomeAdmin() {
        require(hasRole(CHECKIN_OUTCOMES_ADMIN_ROLE, msg.sender), "Caller is not the outcomes admin");
        _;
    }

    constructor(address outcomesAdmin, address randomAddress) {
        _grantRole(CHECKIN_OUTCOMES_ADMIN_ROLE, outcomesAdmin);
        random = IRandom(randomAddress);
    }

    function getOutcome(address player) external returns (int256) {
        // Combine the base randomness with the nonce & player address to create unique randomness
        uint256 rand = uint256(keccak256(abi.encodePacked(random.random(), playerNonces[player]++, player)));

        // Check for disqualification
        if (rand % PRECISION < DISQUALIFICATION_CHANCE) {
            return DISQUALIFIED_OUTCOME;
        }

        // Generate a random outcome between 1 and OUTCOME_RANGE
        uint256 outcome = (rand % OUTCOME_RANGE) + 1;

        // Determine sign randomly (50/50 chance)
        bool isNegative = (rand >> 128) % 2 == 0;

        // Apply the sign
        return isNegative ? -int256(outcome) : int256(outcome);
    }

    function setConfiguration(uint256 outcomeRange, uint256 disqualificationChance, uint256 precision)
        public
        onlyOutcomeAdmin
    {
        OUTCOME_RANGE = outcomeRange;
        DISQUALIFICATION_CHANCE = disqualificationChance;
        PRECISION = precision;

        emit ConfigurationUpdated(outcomeRange, disqualificationChance, precision);
    }
}
