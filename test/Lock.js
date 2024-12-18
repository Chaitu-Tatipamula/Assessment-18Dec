const { expect } = require("chai");
const {ethers} = require("hardhat");

describe("OTPAuth Smart Contract", function () {
    let OTPAuth, otpAuth;
    let user1, user2;

    beforeEach(async function () {
      OTPAuth =  await ethers.getContractFactory("OTPAuth")
      otpAuth = await OTPAuth.deploy();

        [owner, user1, user2] = await hre.ethers.getSigners();
    });

    it("should register a user successfully", async function () {
        const username = "user1";
        const seed = "seed123";
        const publicKey = user1.address;

        await expect(otpAuth.connect(user1).registerUser(username, publicKey, seed))
          .to.emit(otpAuth, "UserRegistered")
          .withArgs(username, publicKey);
    });

    it("should generate a valid OTP for a user", async function () {
        const username = "user1";
        const seed = "seed123";
        const publicKey = user1.address;

        await otpAuth.connect(user1).registerUser(username, publicKey, seed);
        let otp = await otpAuth.connect(user1).generateOTP(username)
        expect(Number(otp))
            .to.be.a("number")
      

    });

    it("should authenticate a user with a valid OTP", async function () {
        const username = "user1";
        const seed = "seed123";
        const publicKey = user1.address;

        await otpAuth.connect(user1).registerUser(username, publicKey, seed);

        const otp = await otpAuth.connect(user1).generateOTP(username);
        
        await expect(otpAuth.connect(user1).authenticate(publicKey, BigInt(otp.toString())))
            .to.emit(otpAuth, "OTPAuthenticated")
            .withArgs(publicKey, true);
    });

    it("should fail authentication with an invalid OTP", async function () {
        const username = "user1";
        const seed = "seed123";
        const publicKey = user1.address;

        await otpAuth.connect(user1).registerUser(username, publicKey, seed);

        const otp = await otpAuth.connect(user1).generateOTP(username);

        const invalidOTP = Number(otp) + 1;

        await expect(otpAuth.connect(user1).authenticate(publicKey, invalidOTP)).to.be.revertedWith(
            "Invalid OTP"
        );
    });

    it("should prevent OTP reuse", async function () {
        const username = "user1";
        const seed = "seed123";
        const publicKey = user1.address;

        await otpAuth.connect(user1).registerUser(username, publicKey, seed);

        const otp = await otpAuth.connect(user1).generateOTP(username);
      
        await otpAuth.connect(user1).authenticate(publicKey, Number(otp));
        await expect(otpAuth.connect(user1).authenticate(publicKey, otp)).to.be.revertedWith(
            "Invalid OTP"
        );
    });

    it("should not allow duplicate username registration", async function () {
        const username = "user1";
        const seed1 = "seed123";
        const seed2 = "seed456";

        await otpAuth.connect(user1).registerUser(username, user1.address, seed1);
        await expect(
            otpAuth.connect(user2).registerUser(username, user2.address, seed2)
        ).to.be.revertedWith("Username already exists");
    });

    it("should not allow duplicate public key registration", async function () {
        const username1 = "user1";
        const username2 = "user2";
        const seed1 = "seed123";
        const seed2 = "seed456";

        await otpAuth.connect(user1).registerUser(username1, user1.address, seed1);
        await expect(
            otpAuth.connect(user1).registerUser(username2, user1.address, seed2)
        ).to.be.revertedWith("Public key already registered");
    });
});
