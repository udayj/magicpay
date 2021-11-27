//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./KeeperCompatibleInterface.sol";
import "./IERC20.sol";
import "./IBentoBoxMinimal.sol";

contract MagicPay is KeeperCompatibleInterface {

    struct Payment {
        uint256 id;
        string email;
        uint256 password;
        uint256 amount;
        uint256 creationTimestamp;
        uint256 interestEarned;
        uint256 klima;
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
    mapping (address => uint256[]) addressToIds;
    event PaymentCreated(uint256 id,string email, uint256 password, uint256 amount);
    IBentoBoxMinimal public bentoContract;

    uint256 public totalInterestEarned;
    uint256 public currentInterestEarned;

    constructor () {
        lastTimeStamp=block.timestamp;
        bentoContract = IBentoBoxMinimal(address(0xF5BCE5077908a1b7370B9ae04AdC565EBd643966));
        bentoContract.registerProtocol();

    }

    function setBentoAddress(address _address) public {
        bentoContract = IBentoBoxMinimal(_address);
        bentoContract.registerProtocol();
    }


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

    function sendPayment(address receiver, uint256 _id, uint256 password) public returns(bool) {
        Payment storage payment=payments[_id];
        require(password == payment.password,"Incorrect Password");
        require(payment.status == 0, "Funds already redeemed");
        uint256 amount = payment.amount;

        withdrawFromBento(_id);

        payment.status = 2;
        payment.klima=payment.interestEarned;


        (bool sent,) = receiver.call{value:amount}("");
        
    //    currentInterestEarned-=amount;
        return sent;
    }   
    
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

    function checkUpkeep(bytes calldata /* checkData */) external override returns (bool upkeepNeeded, bytes memory /*performData */) {
        upkeepNeeded = ( block.timestamp - lastTimeStamp ) > interval;
    }

    function checkValidityUpkeep() public view returns (bool) {
            bool upkeepNeeded = ( block.timestamp - lastTimeStamp ) > interval;
            return upkeepNeeded;
    }
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
                payment.klima = 50;
                payment.status=3;
            }
        }
    }


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

    function getWMatic(uint256 amt) public {
        IERC20 wmatic = IERC20(address(0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889));
        wmatic.deposit{value:amt}();
        
    }

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
            interest = 100;
        }
        payments[_id].amountBento = amountOut;
        payments[_id].shareBento=0;
        payments[_id].interestEarned = interest;
        //currentInterestEarned+=interest;
        totalInterestEarned+=interest;
        convertToMatic(amountOut);

    }

    function convertToMatic(uint256 amount) public {
        IERC20 wmatic = IERC20(address(0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889));
        wmatic.withdraw(amount);
    }

    fallback() external payable {}

    receive() external payable{}
}
