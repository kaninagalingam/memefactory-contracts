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
    var replacement = replacement.replace('0x', '');
    var bytecode = contract.bytecode.replace(placeholder, replacement);
    contract.bytecode = bytecode;
    return contract;
  }

  // function waitForReceipt(hash, cb) {
  //   web3.eth.getTransactionReceipt(hash, function (err, receipt) {
  //     if (err) {
  //       error(err);
  //     }

  //     if (receipt !== null) {
  //       // Transaction went through
  //       if (cb) {
  //         cb(receipt);
  //       }
  //     } else {
  //       // Try again in 1 second
  //       window.setTimeout(function () {
  //         waitForReceipt(hash, cb);
  //       }, 1000);
  //     }
  //   });
  // }
  
};

module.exports = utils;
