//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./KeeperCompatibleInterface.sol";
import "./IERC20.sol";
import "./IBentoBoxMinimal.sol";

/// @title Main coordinating contract for the system
/// @author udayj
/// @dev the constructor only initialises the lastTimeStamp and bentoboxContract variables
contract MagicPay is KeeperCompatibleInterface {

    ///This struct represents an individual deposit of crypto being sent to Alice
    struct Payment {
        uint256 id;
        string email;
        uint256 password;
        uint256 amount;
        uint256 creationTimestamp;
        uint256 interestEarned;
        uint256 klima; // keeps track of klima bought using the interest from a particular instance of payment, presently stub
        uint256 maticEarned;
        uint256 amountBento;
        uint256 shareBento;
        address creator;
        uint8 status;
    }

    uint256 public interval=300;
    uint256 public waitInterval=120;
    uint256 public lastTimeStamp;
    uint256 public id;
    mapping (uint256 => Payment) idToPayment;
    Payment[] public payments;

    //keeps track of all payment ids created by an address
    mapping (address => uint256[]) addressToIds;

    //event monitored by front-end so that email can be sent with link after crypto deposited in the system

    event PaymentCreated(uint256 id,string email, uint256 password, uint256 amount);
    IBentoBoxMinimal public bentoContract;

    uint256 public totalInterestEarned;
    uint256 public currentInterestEarned;

    constructor () {
        lastTimeStamp=block.timestamp;
        bentoContract = IBentoBoxMinimal(address(0xF5BCE5077908a1b7370B9ae04AdC565EBd643966));
        bentoContract.registerProtocol();

    }
    /// @notice - function used to set the bentobox contract address in case we need to change it from initialisation
    function setBentoAddress(address _address) public {
        bentoContract = IBentoBoxMinimal(_address);
        bentoContract.registerProtocol();
    }


    /// @notice - this function kickstarts the cycle of deposit and redeem/refund
    ///           it simply creates a deposit(payment) in the system, sets up the necessary references
    ///           deposits the funds into bentobox, emits the event for the front-end
    /// @param email - the email id to which the crypto has been sent
    /// @param password - the password which Alice needs to enter to redeem the crypto (we store only keccack256 hash)
    ///@param amount - the amount being deposited, has to be equal to the value sent in the transaction
    function createPayment(string memory email,uint256 password,uint256 amount) public payable {

        require(msg.value==amount,"Amount given differs from amount intended");
        uint256 currentId = id;
        Payment memory payment = Payment (currentId, email,password,amount,block.timestamp,0,0,0,0,0,msg.sender,0); 
        payments.push(payment);
        idToPayment[currentId]=payments[payments.length-1];
        id++;
        addressToIds[msg.sender].push(currentId);
        console.log("Payment created");
        console.log("email :",email);
        console.log("password hash:",password);
        console.log("amount:",amount);
        console.log("id:",currentId);
        depositToBento(currentId,msg.value);
        emit PaymentCreated(currentId,email,password,amount);
    }


    function getPayment (uint256 _id) public view returns(Payment memory) {
        Payment memory payment = payments[_id];
        console.log("id:",payment.id);
        console.log("email:",payment.email);
        console.log("password:",payment.password);
        console.log("amount:",payment.amount);
        console.log("status:",payment.status);
        console.log("shareBento:",payment.shareBento);
        console.log("amountBento:",payment.amountBento);
        console.log("klima:",payment.klima);
        return payment;
    }


    ///@notice - this function is called by the front-end when a user comes and tries to redeem the crypto sent on email
    ///          it first withdraws the Wrapped MAtic from Bentobox and then sends the principal amount to the receiver address
    ///@param receiver - this public address is generated by the front end and the crypt will be sent here
    ///@param _id - the payment(deposit) id which is being redeemed
    ///@param password the password will be matched with the stored password
    function sendPayment(address receiver, uint256 _id, uint256 password) public returns(bool) {
        Payment storage payment=payments[_id];
        require(password == payment.password,"Incorrect Password");
        require(payment.status == 0, "Funds already redeemed");
        uint256 amount = payment.amount;

        withdrawFromBento(_id);

        //status of 2 means redeemed
        payment.status = 2;
        payment.klima=payment.interestEarned;


        (bool sent,) = receiver.call{value:amount}("");
        
    //    currentInterestEarned-=amount;
        return sent;
    }   
    
    ///@notice - returns payments(deposits) made by an address
    function getPaymentsForAddress() public view returns(string[] memory,uint256[] memory,uint8[] memory,
                                                        uint256[] memory, uint256[] memory) {
        address creator = msg.sender;
        uint256 len = addressToIds[creator].length;
        string[] memory email = new string[](len);
        uint256[] memory amount = new uint256[](len);
        uint8[] memory status = new uint8[](len);
        uint256[] memory klima = new uint256[](len);
        uint256[] memory interestEarned = new uint256[](len);

        for(uint256 i=0;i<addressToIds[creator].length;i++) {
            Payment memory payment = payments[addressToIds[creator][i]];
            email[i]=payment.email;
            amount[i]=payment.amount;
            status[i]=payment.status;
            klima[i]=payment.klima;
            interestEarned[i]=payment.interestEarned;
        }

        return (email,amount,status,klima,interestEarned);
    }

    ///@notice - this is part of the KeeperCompatibleIntarface function
    ///          it will be called by the Keepers network to check if sufficient time has elapsed to perform a refund

    function checkUpkeep(bytes calldata /* checkData */) external override returns (bool upkeepNeeded, bytes memory /*performData */) {
        upkeepNeeded = ( block.timestamp - lastTimeStamp ) > interval;
    }


    function checkValidityUpkeep() public view returns (bool) {
            bool upkeepNeeded = ( block.timestamp - lastTimeStamp ) > interval;
            return upkeepNeeded;
    }

    ///@notice - this function will be called by the Keepers network to initiate a refund of the deposited crypto
    ///          it withdraws crypto for all payments(deposits) where sufficient time has elapsed and refunds the principal amount

    function performUpkeep(bytes calldata /*performData*/) external override {
        lastTimeStamp = block.timestamp;

        for(uint256 i=0;i<payments.length;i++) {
            if(payments[i].status!=0) {
                continue;
            }
            if(block.timestamp - payments[i].creationTimestamp> waitInterval) {
                withdrawFromBento(i);
                (bool sent,)=(payments[i].creator).call{value:payments[i].amount}("");
                Payment storage payment = payments[i];
                payments[i].klima=payments[i].interestEarned;
                //currentInterestEarned-=payments[i].amount;
                payments[i].status=3;
                //we just randomly set a particular value for klima since sushiswap on the testnet did not have sufficient liquidity
                //for wmatic/klima pool
                payment.klima = 50;
                //status of 3 means refunded
                payment.status=3;
            }
        }
    }

    ///@notice - stub function to check if the performUpkeep function is working correctly, just mirrors the above function

    function performUpkeep2() public {
        lastTimeStamp = block.timestamp;

        for(uint256 i=0;i<payments.length;i++) {
            if(payments[i].status!=0) {
                continue;
            }
            if(block.timestamp - payments[i].creationTimestamp> waitInterval) {
                withdrawFromBento(i);
                (bool sent,)=(payments[i].creator).call{value:payments[i].amount}("");
                Payment storage payment = payments[i];
                payments[i].klima=payments[i].interestEarned;
                //currentInterestEarned-=payments[i].amount;
                //status of 3 means refunded
                payments[i].status=3;
                payment.klima = payments[i].interestEarned;
                payment.status=3;
            }
        }
    }
    function setInterval(uint256 _interval) public {
        interval=_interval;
    }

    function setWaitInterval(uint256 _waitInterval) public {
        waitInterval = _waitInterval;
    }

    function getId() public view returns(uint256) {
        return id;
    }

    ///@notice - just gets wrapped matic corresponding to a particular amount of matic
    function getWMatic(uint256 amt) public {
        IERC20 wmatic = IERC20(address(0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889));
        wmatic.deposit{value:amt}();
        
    }

    ///@notice - this function deposits the given amount of matic to bentobox and keeps track of the corresponding amount of shares

    function depositToBento(uint256 currentId, uint256 amt) public {

        getWMatic(amt);
        uint256 amountOut=0;
        uint256 shareOut=0;
        (amountOut, shareOut) = deposit(amt);

        
        payments[currentId].shareBento = shareOut;
    }



    function deposit(uint256 amt) public returns(uint256,uint256) {
        
        address matic = address(0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889);
        IERC20(matic).approve(address(0xF5BCE5077908a1b7370B9ae04AdC565EBd643966),amt);
        (uint256 amountOut,uint256 shareOut1) = bentoContract.deposit(
            matic,
            address(this),
            address(this),
            amt,
            0
            );
        return (amountOut,shareOut1);
    }

    function getShareBentoForPayment(uint256 id) public view returns(uint256) {
        console.log("share:",payments[id].shareBento);
        return payments[id].shareBento;
    }

    function getAmountBentoForPayment(uint256 id) public view returns(uint256) {
        return payments[id].amountBento;
    }



    function withdrawBento(uint256 shares) public returns(uint256 amountOut, uint256 shareOut1) {

        address matic = address(0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889);
        (uint256 amountOut,uint256 shareOut1) = bentoContract.withdraw(
            matic,
            address(this),
            address(this),
            0,
            shares    
            );
        
        return (amountOut,shareOut1);

    }

    ///@notice - this function withdraws the shares corresponding to a given payment(deposit) id, updates interest earned, shares

    function withdrawFromBento(uint256 _id) public {
        uint256 shares = payments[_id].shareBento;
        uint256 amountOut=0;
        uint256 shareOut=0;
        uint256 interest=0;
        (amountOut, shareOut)=withdrawBento(shares);
        if(amountOut > payments[_id].amount){
            interest = amountOut - payments[_id].amount;
        }
        else {
            //doing this just for demonstration since the time being set was 5 minutes and in this time almost no interest was being
            //earned, it wont be necessary in a production version
            interest = 100;
        }
        payments[_id].amountBento = amountOut;
        payments[_id].shareBento=0; //all shares are withdrawn for this particular payment(deposit)
        payments[_id].interestEarned = interest;
        //currentInterestEarned+=interest;
        totalInterestEarned+=interest;
        convertToMatic(amountOut);

    }

    ///@notice - this function converts a given amount of wmatic to matic for redeeming or refunding purpose

    function convertToMatic(uint256 amount) public {
        IERC20 wmatic = IERC20(address(0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889));
        wmatic.withdraw(amount);
    }

    fallback() external payable {}

    receive() external payable{}
}
