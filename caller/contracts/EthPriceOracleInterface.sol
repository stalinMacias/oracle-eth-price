pragma solidity >=0.8.0 <0.9.0;

interface EthPriceOracleInterface {
  function getLatestEthPrice() external returns (uint256);
}
