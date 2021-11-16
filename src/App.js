import logo from './logo.svg';
import './App.css';
import React, {useEffect, useState} from 'react';
import { ethers } from "ethers";
import magicPay from './utils/magicpay.json';
import Wallet from 'ethereumjs-wallet';

const CONTRACT_ADDRESS='0x5FbDB2315678afecb367f032d93F642f64180aa3';
class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {emailValue: '',
                  passwordValue:'',
                  amountValue:'',
                  startBlockNumber:''};

    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    
  }

  handleEmailChange(event) {
    this.setState({emailValue: event.target.value});
  }

  handlePasswordChange(event) {
    this.setState({passwordValue: event.target.value});
  }

  handleAmountChange(event) {
    this.setState({amountValue: event.target.value});
  }

  
  handlePaymentCreation = (...args)  => {

    console.log(this.state.startBlockNumber);
    const event = args[args.length - 1];
    console.log(event.blockNumber);
    if(event.blockNumber <= this.state.startBlockNumber) {
      return;
    }

    var id = args[0];
    var hashEmail = args[1];
    var hashPassword = args[2];
    var amount = args[3];

    alert("Payment created:"+id.toString());
    console.log("id:",id.toString());
    console.log("email hash:",hashEmail.toHexString());
    console.log("password hash:",hashPassword.toHexString());
    console.log("amount:",amount.toString());
    
}

  async handleSubmit(event) {
    //alert('A name was submitted: ' + this.state);
    alert(this.state.emailValue);

    //let hashEmail=ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.state.emailValue));
    let hashEmail=ethers.utils.id(this.state.emailValue);
    let hashPassword=ethers.utils.id(this.state.passwordValue);
    console.log("Email:"+this.state.emailValue);
    console.log("Email Hash:"+hashEmail);
    console.log("Password:"+this.state.passwordValue);
    console.log("Password Hash:"+hashPassword);
    console.log("Email bigint:",ethers.BigNumber.from(hashEmail));
    console.log("Password bigint:",ethers.BigNumber.from(hashPassword));
    let wei=ethers.utils.parseUnits(this.state.amountValue,"wei");
    console.log("Amount:"+wei);
    event.preventDefault();

    let overrides = {
      value: wei
    };


    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const payContract = new ethers.Contract(
    CONTRACT_ADDRESS,
    magicPay.abi,
    signer
      );
    
    const blockNumber = await provider.getBlockNumber();
    this.setState({startBlockNumber:blockNumber}); 

    await payContract.createPayment(hashEmail,hashPassword,wei,overrides);
    payContract.on("PaymentCreated", this.handlePaymentCreation);
    
    
    
  }

  

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Email
          <input type="email" value={this.state.emailValue} onChange={this.handleEmailChange} />
        </label>
        <label>
          Password
          <input type="text" value={this.state.passwordValue} onChange={this.handlePasswordChange} />
        </label>
        <label>
          Amount
          <input type="text" value={this.state.amountValue} onChange={this.handleAmountChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}


function App() {

  const [currentAccount, setCurrentAccount] = useState("");

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
    } else {
        console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: 'eth_accounts' });

    if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        
        // Setup listener! This is for the case where a user comes to our site
        // and ALREADY had their wallet connected + authorized.
        
    } else {
        console.log("No authorized account found")
    }
}


  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

      // Setup listener! This is for the case where a user comes to our site
      // and connected their wallet for the first time.
      
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);


  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  return (
    <div className="App">
      <header className="App-header">
      {currentAccount === "" ? renderNotConnectedContainer() : <NameForm /> }
      </header>
    </div>
  );
}

export default App;
