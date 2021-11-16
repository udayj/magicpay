const main = async () => {
    const payContractFactory = await hre.ethers.getContractFactory('MagicPay');
    const payContract = await payContractFactory.deploy();
    await payContract.deployed();
    console.log("Contract deployed to:",payContract.address);
};

const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch(error) {
        console.log(error);
        process.exit(1);
    }
};

runMain();