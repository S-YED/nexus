// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HelloWorld
 * @notice Simple contract to verify Flare Coston2 deployment
 * @dev This is a test contract to ensure the development environment is properly configured
 */
contract HelloWorld {
    string public message;
    address public owner;
    uint256 public deploymentTimestamp;

    event MessageUpdated(string oldMessage, string newMessage, address updatedBy);

    /**
     * @notice Constructor sets initial message and owner
     */
    constructor() {
        message = "Hello Flare!";
        owner = msg.sender;
        deploymentTimestamp = block.timestamp;
    }

    /**
     * @notice Get the current message
     * @return The current message string
     */
    function getMessage() public view returns (string memory) {
        return message;
    }

    /**
     * @notice Update the message
     * @param _newMessage The new message to set
     */
    function setMessage(string memory _newMessage) public {
        string memory oldMessage = message;
        message = _newMessage;
        emit MessageUpdated(oldMessage, _newMessage, msg.sender);
    }

    /**
     * @notice Get contract information
     * @return Current message, owner address, and deployment timestamp
     */
    function getInfo() public view returns (string memory, address, uint256) {
        return (message, owner, deploymentTimestamp);
    }
}
