# oracle-eth-price - centralized-oracle branch
* This branch contains the code for a centralized oracle.
* By centralized it means that a single oracle is able to update the ETH Price in the Caller Contract
* master branch contains the code of a decentralized oracle - It is adapted to be able to receive multiple responses for the same request and set the new ETH Price based on the average price of all the responses for the same request

Building an Oracle to update the ETH price retrieving the information from the Binance API

## This is a space to document the code execution flow

updatePrice() from the CallerContract calls the getLatestEthPrice() from the EthPriceOracle contract

getLatestEthPrice() emits the GetLatestEthPriceEvent which is catched up by EthPriceOracle.js which will execute a number of function till finally the setLatestEthPrice() function is execute
	- setLatestEthPrice() when executed send a transaction to the oracleContract using the method setLatestEthPrice()

setLatestEthPrice() in the EthPriceOracle contract will actually call the callback() function from the CallerContract and finally the ETH Price will be updated in the CallerContract at this point!

### Add any useful description to make it easier to understand the execution's flow
