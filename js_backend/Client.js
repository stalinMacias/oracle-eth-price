const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const CallerJSON = require('./contracts/CallerContract.json')
const OracleJSON = require('./contracts/EthPriceOracle.json')

async function getCallerContract (web3js) {
  console.log("Running in the getCallerContract()")
  console.log(await web3js.eth.net.getId())
  const networkId = await web3js.eth.net.getId()
  console.log("netowrkId: ", networkId)
  return new web3js.eth.Contract(CallerJSON.abi, CallerJSON.networks[networkId].address)
}
/*
async function retrieveLatestEthPrice () {
  console.log("Trying to connect to the binance api")
  const resp = await axios({
    url: 'https://api.binance.com/api/v3/ticker/price',
    params: {
      symbol: 'ETHUSDT'
    },
    method: 'get',
    agent: new Agent({ rejectUnauthorized: false })
  })
  return resp.data.price
}
*/

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
  const { ownerAddress, web3js } = await common.initializeConnection()
  //console.log("Web3js object: " , web3js)
  const callerContract = await getCallerContract(web3js)
  console.log("callerContract; " , callerContract)
  filterEvents(callerContract)
  return { callerContract, ownerAddress, web3js }
}

(async () => {
  const { callerContract, ownerAddress, web3js } = await init()
  process.on( 'SIGINT', () => {
    console.log('Calling prcoess.exit()')
    process.exit( );
  })
  const networkId = await web3js.eth.net.getId()
  const oracleAddress =  OracleJSON.networks[networkId].address
  await callerContract.methods.setOracleInstanceAddress(oracleAddress).send({ from: ownerAddress })
  setInterval( async () => {
    callerContract.methods.updateEthPrice().send({ from: ownerAddress })
  }, SLEEP_INTERVAL);
})()
