const axios = require('axios')
const BN = require('bn.js')
const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 4000
const CHUNK_SIZE = process.env.CHUNK_SIZE || 3
const MAX_RETRIES = process.env.MAX_RETRIES || 5
const OracleJSON = require('./contracts/EthPriceOracle.json')
const OWNER_KEYS = process.env.OWNER_KEYS || ""
var pendingRequests = []

async function getOracleContract (web3js) {
  const networkId = await web3js.eth.net.getId()
  return new web3js.eth.Contract(OracleJSON.abi, OracleJSON.networks[networkId].address)
}

async function retrieveLatestEthPrice () {
  const resp = await axios({
    url: 'https://api.binance.com/api/v3/ticker/price',
    params: {
      symbol: 'ETHUSDT'
    },
    method: 'get'
  })
  return resp.data.price
}

async function filterEvents (oracleContract, web3js) {
  oracleContract.events.GetLatestEthPriceEvent(async (err, event) => {
    if (err) {
      console.error('Error on event', err)
      return
    }
    await addRequestToQueue(event)
    console.log("Incoming request to update ETH Price")
  })

  oracleContract.events.SetLatestEthPriceEvent(async (err, event) => {
    if (err) {
      console.error('Error on event', err)
      return
    }
    console.log("ETH Price was updated in the Oracle contract")
  })
}


async function addRequestToQueue (event) {
  const callerAddress = event.returnValues.callerAddress
  const id = event.returnValues.id
  pendingRequests.push({ callerAddress, id })
}


async function processQueue (oracleContract, ownerAddress, web3js) {
  let processedRequests = 0
  //console.log("Pending requests to be processed:" ,pendingRequests);
  while (pendingRequests.length > 0 && processedRequests < CHUNK_SIZE) {
    const req = pendingRequests.shift()
    await processRequest(oracleContract, ownerAddress, req.id, req.callerAddress, web3js)
    processedRequests++
  }
}

async function processRequest (oracleContract, ownerAddress, id, callerAddress, web3js) {
  let retries = 0
  while (retries < MAX_RETRIES) {
    try {
      const ethPrice = await retrieveLatestEthPrice()
      //const ethPrice = 1600
      await setLatestEthPrice(oracleContract, callerAddress, ownerAddress, ethPrice, id, web3js)
      return
    } catch (error) {
      if (retries === MAX_RETRIES - 1) {
        await setLatestEthPrice(oracleContract, callerAddress, ownerAddress, '0', id, web3js)
        return
      }
      retries++
    }
  }
}


async function setLatestEthPrice (oracleContract, callerAddress, ownerAddress, ethPrice, id, web3js) {
  ethPrice = ethPrice.replace('.', '')
  const multiplier = new BN(10**10, 10)
  const ethPriceInt = (new BN(parseInt(ethPrice), 10)).mul(multiplier)
  const idInt = new BN(parseInt(id))
  try {
    console.log("Trying to execute the setLatestEthPrice() in the EthPriceOracle contract!");
    //await oracleContract.methods.setLatestEthPrice(ethPriceInt.toString(), callerAddress, idInt.toString()).send({ from: ownerAddress })

    // Defining the transaction
    let setLatestEthPriceRequest = oracleContract.methods.setLatestEthPrice(ethPriceInt.toString(), callerAddress, idInt.toString())
    //console.log("setLatestEthPriceRequest: ", setLatestEthPriceRequest);

    // Signing the transaction as the CallerContract's owner
    //let signedTransaction  = await web3js.eth.accounts.signTransaction(options, OWNER_KEYS);
    let signedSetLatestEthPriceTransaction  = await web3js.eth.accounts.signTransaction(await common.generateTransactionsOptions(setLatestEthPriceRequest, ownerAddress, web3js), OWNER_KEYS);
    //console.log("signedSetLatestEthPriceTransaction: ", signedSetLatestEthPriceTransaction);

    // Sending the signed transaction
    console.log("Sending the signed transaction to execute the setLatestEthPrice() in the Oracle Contract");
    await common.sendingSignedTransactions(signedSetLatestEthPriceTransaction, web3js, "Calling the setLatestEthPrice() method in the Oracle Contract to call the callback() in the CallerContract that will update the ETH Price in the Caller Contract")

  } catch (error) {
    console.log('Error encountered while calling setLatestEthPrice.')
    // Do some error handling
  }
}

async function init () {
  const { ownerAddress, web3js, clientAddress } = await common.initializeConnection()
  //console.log("Web3js object: " , web3js)
  const oracleContract = await getOracleContract(web3js)
  console.log("Oracle contract address " , oracleContract._address)
  filterEvents(oracleContract, web3js)
  return { oracleContract, web3js, ownerAddress, clientAddress }
}


(async () => {
  const { oracleContract, web3js, ownerAddress, clientAddress } = await init()
  console.log("Initialized the oracle contract & retrieved its owner address")

  process.on( 'SIGINT', () => {
    process.exit( )
  })

  setInterval(async () => {
    await processQueue(oracleContract, ownerAddress, web3js)
    const ethPrice = await retrieveLatestEthPrice()
    console.log("eth price: ", ethPrice)
  }, SLEEP_INTERVAL)
})()

