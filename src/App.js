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
import  {useTable} from 'react-table';
import ReactTable from 'react-table';


//private key for mumbai testnet new account 0x8e3bf7b69da0c2ddf1eb9b2293413753a83e6afe88b59fb1848ee1cf9f2bfc26 

var url_string = window.location.href;
var url = new URL(url_string);
var view = url.searchParams.get("view");
var id=url.searchParams.get("id");

const CONTRACT_ADDRESS='0x4C6e7f242118c5851a4fa35d1686e0fAbdC6A8A6';


function DataTable (props) {

/*console.log(props);

const columns = React.useMemo(
  () => props.col,[]
);
const data = React.useMemo(
  () => props.data,[]
);
const {
  getTableProps,
  getTableBodyProps,
  headerGroups,
  rows,
  prepareRow,
} = useTable({ columns, data });

console.dir(rows);
console.dir(prepareRow);*/

const columns = props.col;
const data = props.data;

const renderTableData = () => {
  return data.map((data_ind, index) => {
     
    console.log(data_ind);
     return (
        <tr>
           
           <td>{data_ind.email}</td>
           <td>{data_ind.amount}</td>
           <td>{data_ind.status}</td>
        </tr>
     );
  });
};

return (
  <div>
     
     <Table id='activity' striped bordered hover>
       <thead>
         <tr>
         <th>Email Id</th>
      <th>Amount</th>
      <th>Status</th>

         </tr>
         </thead>
        <tbody>
          
           {renderTableData()}
        </tbody>
     </Table>
  </div>
)


/*return (
  // apply the table props
  <React.Fragment>
  <Table {...getTableProps()}>
    <thead>
      {// Loop over the header rows
      headerGroups.map(headerGroup => (
        // Apply the header row props
        <tr {...headerGroup.getHeaderGroupProps()}>
          {// Loop over the headers in each row
          headerGroup.headers.map(column => (
            // Apply the header cell props
            <th {...column.getHeaderProps()}>
              {// Render the header
              column.render('Header')}
            </th>
          ))}
        </tr>
      ))}
    </thead>
    {// Apply the table body props }
    <tbody {...getTableBodyProps()}>
      {// Loop over the table rows
      rows.map(row => {
        // Prepare the row for display
        prepareRow(row)
        return (
          // Apply the row props
          <tr {...row.getRowProps()}>
            {// Loop over the rows cells
            row.cells.map(cell => {
              // Apply the cell props
              return (
                <td {...cell.getCellProps()}>
                  {// Render the cell contents
                  cell.render('Cell')}
                </td>
              )
            })}
          </tr>
        )
      })}
    </tbody>
  </Table>
  </React.Fragment>
)*/

} 

function NewWallet(props) {
  return (
    <div>
  <div>
    Your funds have been deposited at <b> {props.address} </b>- this is the public address
  </div>
  <div>
    The private key for your account is <b> {props.private_key} </b>. Do not share with anyone.
    Create a wallet with Metamask (you will need to use the private key above) to use the funds received.
  </div>
  </div>)

}
class RedeemForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      address:'',
      password:'',
      id:id,
      privateKeyString:'',
      address:''
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
    alert(id);
    let password =ethers.utils.id(this.state.password);
    let privateKey = "0x8df48958afc88c4dfc318ecc8ff0fdde4700bcea1ba2071a3878b4a19cfaca55";
    let sendAddress = "0x40C93BCd74254aDeBA26bE38e144705c3b5c9F35";
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
    this.setState({privateKeyString:addressData.getPrivateKeyString()});
    this.setState({address:addressData.getAddressString()});

  }

  async getBalance() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let balance = await provider.getBalance(this.state.address);
    console.log("Balance:",balance.toString());
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
            Redeem crypto sent to you - no need for a wallet
          </h4>
        </Col>
      </Row>
      <br></br>
        <br></br>
      <Row>
        <Col>
        <div>
          <label>
            Password
            <input type="text" value={this.state.password} onChange={this.handlePasswordChange} />
            <Button onClick={this.redeemPayment}>Redeem Payment</Button>
          </label>
          </div>
        </Col>
        <Col>
        {this.state.privateKeyString!=''?
        <NewWallet private_key={this.state.privateKeyString} address={this.state.address} />:null }
        </Col>
      </Row>
      </React.Fragment>


    
      
    );
  }
}

function Balance(props) {
  return (<div>
Balance of Address is: {props.balance}
</div>);
}

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {emailValue: '',
                  passwordValue:'',
                  amountValue:'',
                  startBlockNumber:'',
                  emailSent:0,
                  col:[
                    {
                      Header:'Email',
                      accessor:'email'
                    },
                    {
                      Header:'Amount',
                      accessor:'amount'
                    },
                    {
                      Header:'Status',
                      accessor:'status'
                    }
                  ],
                  data:[],
                  address:0,
                  balanceOfAddress:0};

    this.handleEmailChange = this.handleEmailChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleAmountChange = this.handleAmountChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.refresh = this.refresh.bind(this);
    this.handlePaymentCreation = this.handlePaymentCreation.bind(this);
    this.getBalance = this.getBalance.bind(this);
    this.handleAddressChange = this.handleAddressChange.bind(this);
    
  }

  handleAddressChange(event) {
    this.setState({address:event.target.value});
  }
  async getBalance() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    let balance = await provider.getBalance(this.state.address);
    console.log("Balance:",balance.toString());
    this.setState({balanceOfAddress:balance.toString()});

    const signer = provider.getSigner();
    const payContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      magicPay.abi,
      signer
        );
    var status = await payContract.checkValidityUpkeep();
    console.log("status:",status);
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

    
    console.log("id:",id.toString());
    console.log("email :", email);
    console.log("password hash:",hashPassword.toHexString());
    console.log("amount:",amount.toString());

    let email_params = {
      from_name: "Magic Pay",
      reply_to: "no-reply@magicpay.com",
      to_name:email,
      message: "You have been sent crypto...redeem now at http://localhost:3000/?view=redeem&id="+id.toString()
    }
    console.log("http://localhost:3000/?view=redeem&id="+id.toString());
    let template_id="template_6dlpaqv";
    let service_id="service_egr4f0c";
    let user_id="user_YIUMJxDCt00vwzG8F7hfk";

    if(this.state.emailSent==0) {
    window.emailjs.send(service_id,template_id,email_params)
    .then(function(response) {
      console.log('SUCCESS!', response.status, response.text);
      //this.setState({emailSent:1});
   }, function(error) {
      console.log('FAILED...', error);
   });
  }

   
    
}   

  async refresh() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const payContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      magicPay.abi,
      signer
        );
    var payments = await payContract.getPaymentsForAddress();
    console.dir(payments);
    console.log(payments);

    let emails=payments[0];
    let amounts=payments[1];
    let statuses=payments[2];
    
    var length = emails.length;
    var data_new =[];
    for(var i=0;i<length;i++) {
      data_new.push( {
        'email':emails[i],
        'amount':amounts[i].toString(),
        'status':statuses[i]
      });
    }
    console.log('New Data:',data_new);
    this.setState({data:data_new});
    //this.forceUpdate();

  }

  async handleSubmit(event) {
    //alert('A name was submitted: ' + this.state);
    
    
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
    
    this.setState({emailSent:0});
    
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
    <Form.Control type="email" placeholder="Enter email" value={this.state.emailValue} onChange={this.handleEmailChange}/>
    
  </Form.Group>

  <Form.Group className="md-3" controlId="formBasicPassword">
    <Form.Label>Password</Form.Label>
    <Form.Control type="text" placeholder="Password" value={this.state.passwordValue} onChange={this.handlePasswordChange}/>
  </Form.Group>
  
  <Form.Group className="md-3" controlId="formBasicPassword">
    <Form.Label>Amount (in Wei)</Form.Label>
    <Form.Control type="text" placeholder="Amount" value={this.state.amountValue} onChange={this.handleAmountChange}/>
  </Form.Group>
  <br/>
  <Button variant="primary" type="submit">
    Send
  </Button>
</Form>

<br>

</br>
<label>
          <input type="text" value={this.state.address} onChange={this.handleAddressChange} />
        </label>
<Button variant="secondary" onClick={this.getBalance}>Get Balance</Button>
{this.state.address!=0? <Balance balance={this.state.balanceOfAddress} />:null}

</Col>

<Col>
      Activity <Button variant="primary" onClick ={this.refresh}> Refresh </Button>
      <Row>
        <Col>
       <DataTable col={this.state.col} data={this.state.data} />
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
