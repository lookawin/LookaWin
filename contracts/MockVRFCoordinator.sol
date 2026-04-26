// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVRFConsumer {
    function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external;
}

// Struct V2.5
struct VRFV2PlusClientRequest {
    bytes32 keyHash;
    uint256 subId;
    uint16  requestConfirmations;
    uint32  callbackGasLimit;
    uint32  numWords;
    bytes   extraArgs;
}

contract MockVRFCoordinator {
    uint256 private requestIdCounter = 1;
    address private lastConsumer;
    uint256 private lastRequestId;

    // Signature V2.5 avec struct
    function requestRandomWords(
        VRFV2PlusClientRequest calldata
    ) external returns (uint256) {
        lastConsumer  = msg.sender;
        lastRequestId = requestIdCounter++;
        return lastRequestId;
    }

    function fulfillRandomWords(uint256 randomWord) external {
        uint256[] memory words = new uint256[](1);
        words[0] = randomWord;
        IVRFConsumer(lastConsumer).rawFulfillRandomWords(lastRequestId, words);
    }
}
