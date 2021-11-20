import logo from './logo.svg';
//import './App.css';
import React, {useEffect, useState} from 'react';
import { ethers } from "ethers";
import magicPay from './utils/magicpay.json';
import Wallet from 'ethereumjs-wallet';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';


var url_string = window.location.href;
var url = new URL(url_string);
var view = url.searchParams.get("view");
var id=url.searchParams.get("id");

const CONTRACT_ADDRESS='0x5FbDB2315678afecb367f032d93F642f64180aa3';
class RedeemForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      address:'',
      password:'',
      id:''
    }

    this.handleAddressChange = this.handleAddressChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleIdChange = this.handleIdChange.bind(this);
    this.redeemPayment = this.redeemPayment.bind(this);
    this.getBalance = this.getBalance.bind(this);
  }

  handlePasswordChange(event) {
    this.setState({password:event.target.value});
  }

  handleIdChange(event) {
    this.setState({id:event.target.value});
  }

  handleAddressChange(event) {
    this.setState({address:event.target.value});
  }

  async redeemPayment() {

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    

    let id = ethers.BigNumber.from(this.state.id);
    let password =ethers.utils.id(this.state.password);
    let privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    let sendAddress = "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
    let addressData = Wallet.generate();
    let receiver = ethers.utils.getAddress(addressData.getAddressString());
    
    let wallet = new ethers.Wallet(privateKey);
    let walletSigner = wallet.connect(provider);
    let ABI = ["function sendPayment(address receiver, uint256 _id, uint256 password) public returns(bool)"];
    let iface = new ethers.utils.Interface(ABI);
    let callData = iface.encodeFunctionData("sendPayment",[receiver,id,password]);
    let currentGasPrice = (await provider.getGasPrice()).toHexString();
    console.log(currentGasPrice);
    
    const tx = {
      from: sendAddress,
      to: CONTRACT_ADDRESS,
      nonce: provider.getTransactionCount(sendAddress,"latest"),
      gasLimit:100000,
      gasPrice: currentGasPrice,
      data:callData
    }

    console.dir(tx);

    try {
      walletSigner.sendTransaction(tx).then((transaction) => {
        console.dir(transaction);
        alert("Payment Sent");
      });
    }
      catch(error) {}
    
    console.log("Private key string:",addressData.getPrivateKeyString());
    console.log("Address:",addressData.getAddressString());
    console.log("Password:",password)
    


    console.log("Payment Sent");


  }

  async getBalance() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let balance = await provider.getBalance(this.state.address);
    console.log("Balance:",balance.toString());
  }
  render() {
    return (
      <Row>
        <Col>
      <div>
        <label>
          <input type="text" value={this.state.address} onChange={this.handleAddressChange} />
        </label>
        <button onClick={this.getBalance}>Get Balance</button>
        <div>
          <label>
            Password
            <input type="text" value={this.state.password} onChange={this.handlePasswordChange} />
            
          </label>
          <label>
            ID
            <input type="text" value={this.state.id} onChange={this.handleIdChange} />
          </label>
          <button onClick={this.redeemPayment}>Redeem Payment</button>
        </div>

      </div>
      </Col>
      </Row>
      
    );
  }
}

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
    var email = args[1];
    var hashPassword = args[2];
    var amount = args[3];

    alert("Payment created:"+id.toString());
    console.log("id:",id.toString());
    console.log("email :", email);
    console.log("password hash:",hashPassword.toHexString());
    console.log("amount:",amount.toString());


    
}

  async handleSubmit(event) {
    //alert('A name was submitted: ' + this.state);
    alert(url);
    alert(view);
    alert(id);
    let addressData = Wallet.generate();
    console.log("Private key string:",addressData.getPrivateKeyString());
    console.log("Address:",addressData.getAddressString());
    //let hashEmail=ethers.utils.keccak256(ethers.utils.toUtf8Bytes(this.state.emailValue));
    let hashEmail=ethers.utils.id(this.state.emailValue);
    let hashPassword=ethers.utils.id(this.state.passwordValue);
    let email=this.state.emailValue;
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

    await payContract.createPayment(email,hashPassword,wei,overrides);
    payContract.on("PaymentCreated", this.handlePaymentCreation);
    
    
    
  }

  

  render() {

    return (
      <React.Fragment>
        

      <Row>
        <Col>
          <h1>
            Magic Pay
          </h1>
          <h4>
            Send crypto to people without wallets (and save the planet while doing so)
          </h4>
        </Col>
      </Row>
      <br></br>
        <br></br>
      <Row>
        
        <Col className="md-3">
      
    <Form onSubmit={this.handleSubmit}>
  <Form.Group className="md-3" controlId="formBasicEmail">
    <Form.Label>Email address</Form.Label>
    <Form.Control type="email" placeholder="Enter email" />
    
  </Form.Group>

  <Form.Group className="md-3" controlId="formBasicPassword">
    <Form.Label>Password</Form.Label>
    <Form.Control type="text" placeholder="Password" />
  </Form.Group>
  
  <Form.Group className="md-3" controlId="formBasicPassword">
    <Form.Label>Amount (in Wei)</Form.Label>
    <Form.Control type="text" placeholder="Amount" />
  </Form.Group>
  <br/>
  <Button variant="primary" type="submit">
    Send
  </Button>
</Form>
</Col>

<Col>
      Activity
      <Row>
        <Col>
        <Table striped bordered hover>
  <thead>
    <tr>
      <th>#</th>
      <th>Email Id</th>
      <th>Amount</th>
      <th>Status</th>
      <th>Klima</th>
    </tr>
  </thead>
  </Table>
        </Col>
      </Row>

</Col>
</Row>
</React.Fragment>
    );
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
    <Container>
  
      {view == 'redeem'? <RedeemForm />: null}
      
      {currentAccount === "" && view =='send' ? renderNotConnectedContainer() : null }
      {currentAccount !="" && view=='send'? <NameForm/> : null}
      
    
    </Container>
  );
}

export default App;
