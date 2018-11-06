const fs = require('fs');

const utils = {
  
  copy: (srcName, dstName, network, address) => {
    const srcPath = __dirname + '/../build/contracts/' + srcName + '.json';
    const dstPath = __dirname + '/../build/contracts/' + dstName + '.json';
    const data = require(srcPath);
    data.contractName = dstName;

    // Save address when given
    if (network && address) {
      data.networks = {};

      // Copy existing networks
      if (fs.existsSync(dstPath)) {
        const existing = require(dstPath);
        data.networks = existing.networks;
      }

      data.networks[network.toString()] = {
        //events: {},
        //links: {},
        address: address
        //transactionHash: ''
      };
    }
    fs.writeFileSync(dstPath, JSON.stringify(data, null, 2), { flag: 'w' });
  },

  linkBytecode: (contract, placeholder, replacement) => {

    // var newBytecode =
    contract.bytecode.replace(placeholder, replacement);

    
  }
  
};

module.exports = utils;
