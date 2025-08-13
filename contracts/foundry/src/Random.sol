// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IRandom} from "./interfaces/IRandom.sol";

contract Random is AccessControl, IRandom {
    bytes32 public constant RANDOMNESS_ADMIN_ROLE = keccak256("RANDOMNESS_ADMIN_ROLE");

    uint256 public random;

    modifier onlyRandomnessAdmin() {
        require(hasRole(RANDOMNESS_ADMIN_ROLE, msg.sender), "Caller is not the randomness admin");
        _;
    }

    constructor(address randomnessAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, randomnessAdmin);
        _grantRole(RANDOMNESS_ADMIN_ROLE, randomnessAdmin);
    }

    function setRandom(uint256 _random) external onlyRandomnessAdmin {
        random = _random;
    }
}
