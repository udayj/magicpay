//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";

contract MagicPay {

    struct Payment {
        uint256 id;
        uint256 email;
        uint256 password;
        uint256 amount;
        uint8 status;
    }
    uint256 public id;
    mapping (uint256 => Payment) idToPayment;
    Payment[] public payments;
    event PaymentCreated(uint256 id,uint256 email, uint256 password, uint256 amount);

    function createPayment(uint256 email,uint256 password,uint256 amount) public payable {

        require(msg.value==amount,"Amount given differs from amount intended");
        uint256 currentId = id;
        Payment memory payment = Payment (currentId, email,password,amount,0); 
        payments.push(payment);
        idToPayment[currentId]=payments[payments.length-1];
        id++;
        console.log("Payment created");
        console.log("email hash:",email);
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
}