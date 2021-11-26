//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "./KeeperCompatibleInterface.sol";

contract MagicPay is KeeperCompatibleInterface {

    struct Payment {
        uint256 id;
        string email;
        uint256 password;
        uint256 amount;
        uint8 status;
        uint256 creationTimestamp;
        uint256 interestEarned;
        uint256 klima;
        address creator;
    }

    uint256 public interval=300;
    uint256 public waitInterval=120;
    uint256 public lastTimeStamp;
    uint256 public id;
    mapping (uint256 => Payment) idToPayment;
    Payment[] public payments;
    mapping (address => uint256[]) addressToIds;
    event PaymentCreated(uint256 id,string email, uint256 password, uint256 amount);

    constructor () {
        lastTimeStamp=block.timestamp;
    }
    function createPayment(string memory email,uint256 password,uint256 amount) public payable {

        require(msg.value==amount,"Amount given differs from amount intended");
        uint256 currentId = id;
        Payment memory payment = Payment (currentId, email,password,amount,0,block.timestamp,0,0,msg.sender); 
        payments.push(payment);
        idToPayment[currentId]=payments[payments.length-1];
        id++;
        addressToIds[msg.sender].push(currentId);
        console.log("Payment created");
        console.log("email :",email);
        console.log("password hash:",password);
        console.log("amount:",amount);
        console.log("id:",currentId);
        emit PaymentCreated(currentId,email,password,amount);
    }

    function getPayment (uint256 _id) public view returns(Payment memory) {
        Payment memory payment = idToPayment[_id];
        console.log("id:",payment.id);
        console.log("email:",payment.email);
        console.log("password:",payment.password);
        console.log("amount:",payment.amount);
        console.log("status:",payment.status);
        return payment;
    }

    function sendPayment(address receiver, uint256 _id, uint256 password) public returns(bool) {
        Payment storage payment=idToPayment[_id];
        require(password == payment.password,"Incorrect Password");
        require(payment.status == 0, "Funds already redeemed");
        uint256 amount = payment.amount;
        (bool sent,) = receiver.call{value:amount}("");
        payment.status = 2;
        return sent;
    }   
    
    function getPaymentsForAddress() public view returns(string[] memory,uint256[] memory,uint8[] memory) {
        address creator = msg.sender;
        uint256 len = addressToIds[creator].length;
        string[] memory email = new string[](len);
        uint256[] memory amount = new uint256[](len);
        uint8[] memory status = new uint8[](len);

        for(uint256 i=0;i<addressToIds[creator].length;i++) {
            Payment memory payment = idToPayment[addressToIds[creator][i]];
            email[i]=payment.email;
            amount[i]=payment.amount;
            status[i]=payment.status;
        }

        return (email,amount,status);
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
                (bool sent,)=(payments[i].creator).call{value:payments[i].amount}("");
                if(sent==true) {
                payments[i].status=1;
                }
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
                (bool sent,)=(payments[i].creator).call{value:payments[i].amount}("");
                if(sent==true) {
                payments[i].status=1;
                }
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
}
