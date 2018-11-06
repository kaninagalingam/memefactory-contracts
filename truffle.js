'use strict';

module.exports = {
  networks: {
    ganache: {
      host: 'localhost',
      port: 8549,
      gas: 5000000,
      gasPrice: 5e9,
      network_id: '*'
    },
    ropsten: {
      host: 'localhost',
      port: 8545,
      gas: 6000000,
      gas: 4712388,
      gasPrice: 100000000000
    }    
  }
};
