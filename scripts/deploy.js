
const hre = require("hardhat");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const authContract = await hre.ethers.deployContract("OTPAuth");
  await authContract.waitForDeployment();
  console.log("OTP Auth Contract Deployed at : ", authContract.target);


  await sleep(30*1000);

  await hre.run("verify:verify",{
    address : authContract.target,
    constructorArguments : []
  })
  
}


main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
