const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 5000
const CallerJSON = require('./contracts/CallerContract.json')
const OracleJSON = require('./contracts/EthPriceOracle.json')
const OWNER_KEYS = process.env.OWNER_KEYS || ""

async function getCallerContract (web3js) {
  //console.log(await web3js.eth.net.getId())
  const networkId = await web3js.eth.net.getId()
  //console.log("netowrkId: ", networkId)
  return new web3js.eth.Contract(CallerJSON.abi, CallerJSON.networks[networkId].address)
}


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
  const callerContract = await getCallerContract(web3js)
  
  filterEvents(callerContract)

  // Setting the oracle contract address
  const networkId = await web3js.eth.net.getId()
  const oracleAddress =  OracleJSON.networks[networkId].address

  console.log("callerContract address " , callerContract._address)
  console.log("oracleAddress address " , oracleAddress)

  //await callerContract.methods.setOracleInstanceAddress(oracleAddress).send({ from: ownerAddress, gasLimit: 100000 })

  // Defining the transaction
  let setOracleInstanceAddress = callerContract.methods.setOracleInstanceAddress(oracleAddress)

  // Signing the transaction as the CallerContract's owner
  // let signedSetOracleInstanceAddressTransaction  = await web3js.eth.accounts.signTransaction(options, OWNER_KEYS);
  let signedSetOracleInstanceAddressTransaction  = await web3js.eth.accounts.signTransaction(await common.generateTransactionsOptions(setOracleInstanceAddress, ownerAddress, web3js), OWNER_KEYS);

  // Sending the signed transaction
  await common.sendingSignedTransactions(signedSetOracleInstanceAddressTransaction, web3js, "setOracleInstanceAddress transaction")

  return { callerContract, ownerAddress, web3js, clientAddress }
}


(async () => {
  const { callerContract, ownerAddress, web3js, clientAddress } = await init()
  process.on( 'SIGINT', () => {
    console.log('Calling precess.exit()')
    process.exit( );
  })  

  let requestedEthPriceTimes = 0;

  setInterval( async () => {
    requestedEthPriceTimes++;
    const price = await callerContract.methods.getCurrentEthPrice().call({ from: ownerAddress })
    console.log("Current Eth price set in the Oracle: ", price);

    if(requestedEthPriceTimes == 10) {
      console.log("5th time requesting the ETC price, time to update the price in the Oracle contract");
    
      // Defining the transaction
      let updatePriceRequest = callerContract.methods.updateEthPrice()

      // Getting the account's current nonce
      accountNonce = await web3js.eth.getTransactionCount(ownerAddress)

      /*
      // Options of the transaction
      let options = {
        nonce: accountNonce,
        to      : updatePriceRequest._parent._address,  // contract's address
        data    : updatePriceRequest.encodeABI(),
        //gas     : await updatePriceRequest.estimateGas({from: ownerAddress}) <----> For some reasong the estimateGas() seems not to be working!
        gas     : hardcodingRequiredGas,
        //networkId : '0x5'
      };
      */

      // Signing the transaction as the CallerContract's owner
      //let signedTransaction  = await web3js.eth.accounts.signTransaction(options, OWNER_KEYS);
      let signedTransaction  = await web3js.eth.accounts.signTransaction(await common.generateTransactionsOptions(updatePriceRequest, ownerAddress, web3js), OWNER_KEYS);

      // Sending the signed transaction
      await common.sendingSignedTransactions(signedTransaction, web3js, "Updating ETH Price in CallerContract Transaction")


      //console.log(updatePriceRequest._parent._address)
      //console.log(options);
      //console.log("Signed Transaction: ", signedTransaction);

      /*
      // Sending the signed transaction
      try {
        web3js.eth.sendSignedTransaction(signedTransaction.rawTransaction)
          .once('transactionHash', function(hash){ 
            console.log("txHash", hash)
            activeTransaction = true;
          })
          .once('receipt', function(receipt){ console.log("receipt", receipt) })
          .on('confirmation', function(confNumber, receipt){ console.log("confNumber",confNumber,"receipt",receipt) })
          .on('error', function(error){ console.log("error", error) })
          .then(function(receipt){
              console.log("Transaction completed!", receipt);
          });
      } catch (error) {
        console.log("Error Sending Transaction", error.message);
      }
      */
      
      // Sending an unsigned transaction - Works for Ganache but not for public blockchains
      // When sending transactions to a public blockchain the transaction must be signed before actually sending it    <---> sendSignedTransaction(signedTransaction.rawTransaction)
      //callerContract.methods.updateEthPrice().send({ from: ownerAddress, gasLimit: 100000 })
      requestedEthPriceTimes = 0
    }
    
  }, SLEEP_INTERVAL);

  module.exports = {
    init,
  };


  /*
  * Force the ETH price to be updated automatically each X time!
  setInterval( async () => {
    callerContract.methods.updateEthPrice().send({ from: ownerAddress, gasLimit: 100000 })
  }, SLEEP_INTERVAL);

  

  */
})()
