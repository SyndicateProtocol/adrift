// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.25;

interface IAllowlistSequencingModule {
    /**
     * @notice Adds an address to the allowlist.
     * @param user The address to be added to the allowlist.
     */
    function addToAllowlist(address user) external;
}
