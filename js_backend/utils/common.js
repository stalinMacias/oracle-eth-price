require('dotenv').config();
const Web3 = require('web3');

const HDWalletProvider = require('@truffle/hdwallet-provider');
const OWNER_KEYS = process.env.OWNER_KEYS || ""
const CLIENT_KEYS = process.env.CLIENT_KEYS || ""
const INFURA_API_KEY = process.env.INFURA_API_KEY || ""

//console.log(OWNER_KEYS)
//console.log(OWNER_KEYS.split(','))
//let aux = OWNER_KEYS.split(',')
//console.log(aux[0])

async function initializeConnection() {
  let provider_owner = await new HDWalletProvider({
    privateKeys: OWNER_KEYS.split(','),
    //providerOrUrl: `https://goerli.infura.io/v3/${INFURA_API_KEY}`
    providerOrUrl: `wss://goerli.infura.io/ws/v3/${INFURA_API_KEY}`   // Goerli through ws (Web Sockets)
    //providerOrUrl: `ws://172.29.224.1:7545`                             // Ganache through ws (Web Sockets)
  })

  let provider_client = await new HDWalletProvider({
    privateKeys: CLIENT_KEYS.split(','),
    //providerOrUrl: `https://goerli.infura.io/v3/${INFURA_API_KEY}`
    providerOrUrl: `wss://goerli.infura.io/ws/v3/${INFURA_API_KEY}`   // Goerli through ws (Web Sockets)
    //providerOrUrl: `ws://172.29.224.1:7545`                             // Ganache through ws (Web Sockets)
  })

  const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://goerli.infura.io/ws/v3/${INFURA_API_KEY}`))   // Goerli
  //const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://172.29.224.1:7545'))                             // Ganache
  //console.log("web3 object: ", web3)

  console.log("Contract's owner address: " ,provider_owner.getAddress())
  console.log("Contract's client address: " ,provider_client.getAddress())
  
  return {
    ownerAddress: provider_owner.getAddress(),
    web3js: web3, 
    clientAddress: provider_client.getAddress()
  }
}

async function getCallerContract (web3js,contractJSON) {
  //console.log(await web3js.eth.net.getId())
  const networkId = await web3js.eth.net.getId()
  //console.log("netowrkId: ", networkId)
  return new web3js.eth.Contract(contractJSON.abi, contractJSON.networks[networkId].address)
}

module.exports = {
  initializeConnection,
  getCallerContract
};