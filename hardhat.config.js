require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    compilers :[
      {
        version: "0.8.4",
      },
      {
        version:"0.7.0",
      },
    ],
    overrides: {
      "@chainlink/contracts/src/v0.7/KeeperCompatible.sol" : {
        version: "0.7.0",
        settings : {},
      },
    },
  },
  networks: {
    hardhat : {
      chainId:1337
    },
    mumbai : {
      url : "https://polygon-mumbai.g.alchemy.com/v2/TzL04FnJ8Nk1b7Nv7bfZ9NCx2iEdyLH3",
      accounts: ["0x8df48958afc88c4dfc318ecc8ff0fdde4700bcea1ba2071a3878b4a19cfaca55"],
    }
  }
};
