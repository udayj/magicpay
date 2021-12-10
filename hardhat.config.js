require("@nomiclabs/hardhat-waffle");

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html

const POLYGON_RPC_URL=process.env.REACT_APP_POLYGON_RPC_URL;
const PRIVATE_KEY=process.env.REACT_APP_PRIVATE_KEY;

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
      url : POLYGON_RPC_URL,
      accounts: [PRIVATE_KEY],
    }
  }
};
