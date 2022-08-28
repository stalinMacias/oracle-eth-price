# oracle-eth-price
Building an Oracle to update the ETH price retrieving the information from the Binance API

## This is a space to document the code execution flow

updatePrice() from the CallerContract calls the getLatestEthPrice() from the EthPriceOracle contract

getLatestEthPrice() emits the GetLatestEthPriceEvent which is catched up by EthPriceOracle.js which will execute a number of function till finally the setLatestEthPrice() function is execute
	- setLatestEthPrice() when executed send a transaction to the oracleContract using the method setLatestEthPrice()

setLatestEthPrice() in the EthPriceOracle contract will actually call the callback() function from the CallerContract and finally the ETH Price will be updated in the CallerContract at this point!

### Add any useful description to make it easier to understand the execution's flow
