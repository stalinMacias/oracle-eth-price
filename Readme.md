# Readme - Decentralized Oracle Version

- This decentralized version allows defining the number of responses coming from Oracle
	- Call the setThreshold() method in Oracle's contract to update the # of required responses to update the price
- The ETH Price set in the Caller Contract is based on the average price of all the responses that were received in the Oracle contract for a given request 
- The Oracle contract implements a Role mechanism that enables defining what addresses are valid oracles, and what addresses are valid Owners of the Oracle's contract
- The Oracles itself are located in the js_backend/ folder
	- The first oracle (EthPriceOracle.js) sends the transactions signed as the Oracle's owner
	- The second oracle (EthPriceSecondOracle.js) sends the transactions signed as the Client's owner
- The Client.js file inside the js_backed/ folder is the one that registers new addresses as valid oracles in the Oracle's contract, is able to update the Threshold, and of course, is where the requests to update the prices are generated from!

- This was a good challenge to practice the implementation of libraries from Open Zeppelin, test my backend knowledge powered by JS, connect a backend service with the blockchain and enable it to send signed transactions to public blockchains!
