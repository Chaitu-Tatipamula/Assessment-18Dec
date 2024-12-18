// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract OTPAuth {

    struct User {
        address publicKey;
        string otpSeed;
        uint256 lastOTPTime;
    }

    mapping(string => User) private usernameToDetails;
    mapping(address => string) private publicKeyToUsername;

    uint256 private constant OTP_VALIDITY_PERIOD = 60;

    event UserRegistered(string username, address publicKey);
    event OTPGenerated(string username, uint256 otp);
    event OTPAuthenticated(address publicKey, bool success);

    function registerUser(string memory username, address publicKey, string memory otpSeed) public {
        require(usernameToDetails[username].publicKey == address(0), "Username already exists");
        require(bytes(publicKeyToUsername[publicKey]).length == 0, "Public key already registered");

        usernameToDetails[username] = User(publicKey, otpSeed, 0);
        publicKeyToUsername[publicKey] = username;

        emit UserRegistered(username, publicKey);
    }

    function generateOTP(string memory username) public view returns (uint256) {
        require(usernameToDetails[username].publicKey != address(0), "User not found");

        User memory user = usernameToDetails[username];
        uint256 currentTimestamp = block.timestamp / OTP_VALIDITY_PERIOD;

        bytes32 hash = _generateHash(user.otpSeed, currentTimestamp);
        uint256 otp = uint256(hash) % 10**6;

        // emit OTPGenerated(username, otp);

        return otp;
    }

    function authenticate(address publicKey, uint256 otp) public {
        string storage username = publicKeyToUsername[publicKey];
        require(bytes(username).length > 0, "Public key not registered");

        User storage user = usernameToDetails[username];
        uint256 currentTimestamp = block.timestamp / OTP_VALIDITY_PERIOD;
        bytes32 bytesotp = _generateHash(user.otpSeed, currentTimestamp);
        uint256 expectedOTP = uint256(bytesotp) % 10**6;
        require(currentTimestamp > user.lastOTPTime, "Invalid OTP");
        require(otp == expectedOTP, "Invalid OTP");

        user.lastOTPTime = currentTimestamp;

        emit OTPAuthenticated(publicKey, true);
    }

    function _generateHash(string memory seed, uint256 timestamp) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(seed, timestamp));
    }
}
