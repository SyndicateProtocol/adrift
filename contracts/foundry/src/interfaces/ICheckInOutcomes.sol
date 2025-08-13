// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

interface ICheckInOutcomes {
    function DISQUALIFIED_OUTCOME() external view returns (int256);
    function OUTCOME_RANGE() external view returns (uint256);
    function getOutcome(address player) external returns (int256);
}
