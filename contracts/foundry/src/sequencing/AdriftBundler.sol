// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {RLPTxBreakdown} from "./RLPTxBreakdown.sol";
import {IDecompressor} from "../interfaces/IDecompressor.sol";

interface ISequencingChain {
    function processTransaction(bytes calldata data) external;
    function processTransactionUncompressed(bytes calldata data) external;
    function processTransactionsBulk(bytes[] calldata data) external;
}

contract AdriftBundler is AccessControl, ISequencingChain {
    bytes32 public constant RANDOMNESS_ROLE = keccak256("RANDOMNESS_ROLE");
    bytes32 public constant SEQUENCER_ROLE = keccak256("SEQUENCER_ROLE");

    IDecompressor public decompressor;
    ISequencingChain public sequencingAddress;

    bytes[] public mempool;
    mapping(address contractAddress => mapping(address playerAddress => uint256 checkinNonce)) public
        playerContractCheckinNonces;

    event MempoolUpdated(uint256 mempoolSize, bytes txn);
    event MempoolCleared();

    constructor(
        address sequencingAddress_,
        address decompressorAddress_,
        address randomnessRole_,
        address sequencerRole_
    ) {
        sequencingAddress = ISequencingChain(sequencingAddress_);
        decompressor = IDecompressor(decompressorAddress_);
        _grantRole(RANDOMNESS_ROLE, randomnessRole_);
        _grantRole(SEQUENCER_ROLE, sequencerRole_);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function updateRandomnessRole(address randomnessRole_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RANDOMNESS_ROLE, randomnessRole_);
    }

    function updateSequencerRole(address sequencerRole_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(SEQUENCER_ROLE, sequencerRole_);
    }

    function addRandomness(bytes calldata randomnessTx) external onlyRole(RANDOMNESS_ROLE) {
        sequencingAddress.processTransactionUncompressed(randomnessTx);

        if (mempool.length != 0) {
            sequencingAddress.processTransactionsBulk(mempool);
            delete mempool;
            emit MempoolCleared();
        }
    }

    function getFunctionSelector(bytes memory data) internal pure returns (bytes4 selector) {
        require(data.length >= 4, "Data too short");
        assembly {
            selector := mload(add(data, 32))
        }
        return selector;
    }

    function processTransactionsBulk(bytes[] calldata txns) external override onlyRole(SEQUENCER_ROLE) {
        _processTransactionsBulk(txns);
    }

    function _processTransactionsBulk(bytes[] memory txns) internal {
        for (uint256 i = 0; i < txns.length; i++) {
            _processTransactionUncompressed(txns[i]);
        }
    }

    function processTransactionUncompressed(bytes calldata txn) public override onlyRole(SEQUENCER_ROLE) {
        _processTransactionUncompressed(txn);
    }

    function _processTransactionUncompressed(bytes memory txn) internal {
        RLPTxBreakdown.DecodedTransaction memory decodedTx = RLPTxBreakdown.decodeTx(txn);
        if (decodedTx.data.length > 0 && !decodedTx.isContractDeployment) {
            // 183ff085 = checkIn()
            if (getFunctionSelector(decodedTx.data) == hex"183ff085") {
                playerContractCheckinNonces[decodedTx.to][decodedTx.from]++;
                mempool.push(txn);
                emit MempoolUpdated(mempool.length, txn);
                return;
            }
        }
        sequencingAddress.processTransactionUncompressed(txn);
    }

    function processTransaction(bytes calldata txn) public override onlyRole(SEQUENCER_ROLE) {
        _processTransaction(txn);
    }

    function _processTransaction(bytes memory txn) internal {
        bytes[] memory decompressedTxs = decompressor.decompress(txn);
        for (uint256 i = 0; i < decompressedTxs.length; i++) {
            _processTransactionUncompressed(decompressedTxs[i]);
        }
    }

    function getMempoolLength() external view returns (uint256) {
        return mempool.length;
    }
}
