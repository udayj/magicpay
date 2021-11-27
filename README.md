# Basic Idea behind the Dapp

So, the idea itself is very simple. The Dapp enables you to **send crypto** (MATIC right now) to any person (Alice) **without a wallet**. You deposit funds into the Dapp and it sends a link to Alice's email id. Alice clicks the link and enters the password (you would communicate this password to Alice offline/online). The Dapp generates a key-pair on Alice's machine and sends the crypto you had deposited to this newly generated public address. Only **Alice has the private key** which she now has to use to create a wallet on, for instance, Metamask. While we wait for Alice to redeem the crypto, we deposit the funds into **Bentobox to earn interest**. Also, if Alice doesnt redeem the crypto in, lets say, 5 days (**Chainlink Keepers helps automate the check** after the wait period), the crypto is refunded back to you. Finally, we **buy $KLIMA** using the interest that was earned from Bentobox and maybe burn it. _This way we also help do our bit to save the climate using money legos while we onboard more people into the crypto ecosystem_. 

createPayment(string memory email,uint256 password,uint256 amount) - is the starting point which initiates a payment

sendPayment(address receiver, uint256 _id, uint256 password) - is the function called by the front end when a user claims the payment. The receiver address is actually generated on the front-end and the private key is known only to the person redeeming the crypto.

performUpkeep(bytes calldata /*performData*/) - is the function which is called by Chainlink Keepers to initiate a refund to the person who had deposited crypto.




