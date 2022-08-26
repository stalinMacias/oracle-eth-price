require('dotenv').config();
const Web3 = require('web3');

const HDWalletProvider = require('@truffle/hdwallet-provider');
const PRIVATE_KEYS = process.env.PRIVATE_KEYS || ""
const INFURA_API_KEY = process.env.INFURA_API_KEY || ""

//console.log(PRIVATE_KEYS)
//console.log(PRIVATE_KEYS.split(','))
let aux = PRIVATE_KEYS.split(',')
//console.log(aux[0])

async function initializeConnection() {
  let provider = await new HDWalletProvider({
    privateKeys: PRIVATE_KEYS.split(','),
    //providerOrUrl: `https://goerli.infura.io/v3/${INFURA_API_KEY}`
    //providerOrUrl: `wss://goerli.infura.io/ws/v3/${INFURA_API_KEY}`   // Goerli through ws (Web Sockets)
    providerOrUrl: `ws://172.29.224.1:7545`                             // Ganache through ws (Web Sockets)
  })

  const web3 = new Web3(new Web3.providers.WebsocketProvider('ws://172.29.224.1:7545'))                             // Ganache
  //const web3 = new Web3(new Web3.providers.WebsocketProvider(`wss://goerli.infura.io/ws/v3/${INFURA_API_KEY}`))   // Goerli
  //console.log("web3 object: ", web3)
  
  return {
    ownerAddress: provider.getAddress(),
    web3js: web3
  }
}

module.exports = {
  initializeConnection,
};