/*
  * The solely purpose of this Simulator program is to manually ask for the ETH Price in the console, and when the counter reaches 5 trigger the contract's functions to update the price in the Oracle

*/

const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 5000
const CallerJSON = require('./contracts/CallerContract.json')
const CLIENT_KEYS = process.env.CLIENT_KEYS || ""


async function filterEvents (callerContract) {
  console.log("Running in the filterEvents")
  callerContract.events.PriceUpdatedEvent({ filter: { } }, async (err, event) => {
    if (err) console.error('Error on event', err)
    console.log('* New PriceUpdated event. ethPrice: ' + event.returnValues.ethPrice)
  })
  callerContract.events.ReceivedNewRequestIdEvent({ filter: { } }, async (err, event) => {
    if (err) console.error('Error on event', err)
  })
}

async function init () {
  console.log("Running in the init() function")
  const { ownerAddress, web3js, clientAddress } = await common.initializeConnection()
  //console.log("Web3js object: " , web3js)
  const callerContract = await common.getCallerContract(web3js,CallerJSON)
  //console.log("callerContract; " , callerContract)
  filterEvents(callerContract)
  return { callerContract, ownerAddress, web3js, clientAddress }
}


(async () => {
  const { callerContract, ownerAddress, web3js, clientAddress } = await init()
  process.on( 'SIGINT', () => {
    console.log('Calling precess.exit()')
    process.exit( );
  })
  // setting the oracle instance address in the callerContract should have been already set by the contract's owner
  // A normal user can't & shouldn't be involved on this process
  //const networkId = await web3js.eth.net.getId()
  //const oracleAddress =  OracleJSON.networks[networkId].address
  //await callerContract.methods.setOracleInstanceAddress(oracleAddress).send({ from: ownerAddress, gasLimit: 100000 })

  let requestedEthPriceTimes = 0;
  let activeTrancation = false;

  setInterval( async () => {
    requestedEthPriceTimes++;
    const price = await callerContract.methods.getCurrentEthPrice().call({ from: clientAddress })
    console.log("Current Eth price set in the Oracle: ", price);

    if(requestedEthPriceTimes == 2 && activeTrancation == false) {
      console.log("5th time requesting the ETC price, time to update the price in the Oracle contract");

      // Defining the transaction
      let updatePriceRequest = callerContract.methods.updateEthPrice()

      const hardcodingRequiredGas = web3js.utils.toWei('0.0000000000001', 'ether')

      //const accountNonce = '0x' + await (web3js.eth.getTransactionCount(clientAddress) + 1).toString(16)
      const accountNonce = await web3js.eth.getTransactionCount(clientAddress)

      // Options of the transaction
      let options = {
        nonce: accountNonce,
        to      : updatePriceRequest._parent._address,  // contract's address
        data    : updatePriceRequest.encodeABI(),
        //gas     : await updatePriceRequest.estimateGas({from: clientAddress}) <----> For some reasong the estimateGas() seems not to be working!
        gas     : hardcodingRequiredGas,
        //networkId : '0x5'
      };

      // Signing the transaction as the Client's Owner
      let signedTransaction  = await web3js.eth.accounts.signTransaction(options, CLIENT_KEYS);


      console.log(updatePriceRequest._parent._address)
      console.log(options);
      console.log("Signed Transaction: ", signedTransaction);

      // Sending the sigend transaction
      try {
        web3js.eth.sendSignedTransaction(signedTransaction.rawTransaction)
          .once('transactionHash', function(hash){ 
            console.log("txHash", hash)
            activeTrancation = true;
          })
          .once('receipt', function(receipt){ console.log("receipt", receipt) })
          .on('confirmation', function(confNumber, receipt){ console.log("confNumber",confNumber,"receipt",receipt) })
          .on('error', function(error){ console.log("error", error) })
          .then(function(receipt){
              console.log("trasaction completed!", receipt);
          });
      } catch (error) {
        console.log("Error Sending Transaction", error.message);
      }
      
      
      // Sending an unsigned transaction - Works for Ganache but not for public blockchains
      // When sending transactions to a public blockchain the transaction must be signed before actually sending it    <---> sendSignedTransaction(signedTrasaction.rawTransaction)
      //callerContract.methods.updateEthPrice().send({ from: clientAddress, gasLimit: 100000 })
      requestedEthPriceTimes = 0
    }
  }, SLEEP_INTERVAL);


})()
