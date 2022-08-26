require('dotenv').config();
const path = require('path');

const HDWalletProvider = require('@truffle/hdwallet-provider');
const PRIVATE_KEYS = process.env.PRIVATE_KEYS || ""
const INFURA_API_KEY = process.env.INFURA_API_KEY || ""

console.log(PRIVATE_KEYS)
console.log(PRIVATE_KEYS.split(','))
let aux = PRIVATE_KEYS.split(',')
console.log(aux[0])
//console.log(aux[1])
//console.log(aux[2])
//console.log(aux[3])

let provider = new HDWalletProvider({
  privateKeys: PRIVATE_KEYS.split(','),
  //providerOrUrl: `https://goerli.infura.io/v3/${INFURA_API_KEY}`
  //providerOrUrl: `wss://goerli.infura.io/ws/v3/${INFURA_API_KEY}`
  providerOrUrl: `http://172.29.224.1:7545`
})

console.log(provider.HDWalletProvider)
console.log(provider.getAddress())
