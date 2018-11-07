const {copy, linkBytecode} = require ("./utils.js");

const DSGuard = artifacts.require("DSGuard");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const DankToken = artifacts.require("DankToken");
const DistrictConfig = artifacts.require("DistrictConfig");

copy ("EternalDb", "MemeRegistryDb");
const MemeRegistryDb = artifacts.require("MemeRegistryDb");

copy ("EternalDb", "ParamChangeRegistryDb");
const ParamChangeRegistryDb = artifacts.require("ParamChangeRegistryDb");

copy ("Registry", "MemeRegistry");
const MemeRegistry = artifacts.require("MemeRegistry");

copy ("Registry", "ParamChangeRegistry");
const ParamChangeRegistry = artifacts.require("ParamChangeRegistry");

copy ("MutableForwarder", "MemeRegistryForwarder");
const MemeRegistryForwarder = artifacts.require("MemeRegistryForwarder");

copy ("MutableForwarder", "ParamChangeRegistryForwarder");
const ParamChangeRegistryForwarder = artifacts.require("ParamChangeRegistryForwarder");

const MemeToken = artifacts.require("MemeToken");
const Meme = artifacts.require("Meme");
const ParamChange = artifacts.require("ParamChange");
const MemeFactory = artifacts.require("MemeFactory");
const ParamChangeFactory = artifacts.require("ParamChangeFactory");

copy ("MutableForwarder", "MemeAuctionFactoryForwarder");
const MemeAuctionFactoryForwarder = artifacts.require("MemeAuctionFactoryForwarder");
const MemeAuctionFactory = artifacts.require("MemeAuctionFactory");
const MemeAuction = artifacts.require("MemeAuction");

const registryPlaceholder = "feedfeedfeedfeedfeedfeedfeedfeedfeedfeed";
const dankTokenPlaceholder = "deaddeaddeaddeaddeaddeaddeaddeaddeaddead";
const forwarderTargetPlaceholder = "beefbeefbeefbeefbeefbeefbeefbeefbeefbeef";
const districtConfigPlaceholder = "abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd";
const memeTokenPlaceholder = "dabbdabbdabbdabbdabbdabbdabbdabbdabbdabb";
const memeAuctionFactoryPlaceholder = "daffdaffdaffdaffdaffdaffdaffdaffdaffdaff";

module.exports = function(deployer, network, accounts) {

  const address = accounts [0];
  const opts = {gas: 4612388, from: address};

  deployer.deploy (DSGuard, opts);

  deployer.then (() => {
    return DSGuard.deployed ();
  }).then ((instance) => {
    // console.log("@@@ DSGuard ", instance.address);
    return instance.setAuthority(instance.address, opts);
  }).then ((tx) => {
    console.log("@@@ DSGuard/setAuthority transaction", tx.receipt.transactionHash, "succesfull");
  }).catch((e) => {
    console.error ('Exception occured:', e);
  });

  deployer.deploy (MiniMeTokenFactory, opts);

  deployer.then (() => {
    return MiniMeTokenFactory.deployed ();
  }).then ((instance) => {
    return deployer.deploy (DankToken, instance.address, 1000000000000000000000000000, opts);
  }).then ((dankToken) => {
    console.log ("@@@ DankToken address", dankToken.address);
  });
  
  deployer.deploy (DistrictConfig, accounts[0], accounts[0], 0, opts);

  deployer.then (() => {
    return [DSGuard.deployed (),
            DistrictConfig.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);    
  }).then (([dSGuard,
             districtConfig]) => {
               return districtConfig.setAuthority(dSGuard.address, opts);
             }).then ((tx) => {
               console.log("@@@ DSGuard/setAuthority transaction", tx.receipt.transactionHash, "succesfull");
             });
  
  deployer.deploy (MemeRegistryDb, opts);
  deployer.deploy (ParamChangeRegistryDb, opts);

  // link bytecode
  deployer.deploy (MemeRegistry, opts).then ((instance) => {
    return linkBytecode(MemeRegistryForwarder, forwarderTargetPlaceholder, instance.address);
  });

  deployer.deploy(MemeRegistryForwarder, opts)
    .then ( (instance) => {
      return instance.target ();
    }).then ( (res) => {
      console.log ("@@@ MemeRegistryForwarder target:",  res);
    });

  // link bytecode
  deployer.deploy (ParamChangeRegistry, opts).then ((instance) => {
    return linkBytecode(ParamChangeRegistryForwarder, forwarderTargetPlaceholder, instance.address);
  });

  deployer.deploy(ParamChangeRegistryForwarder, opts)
    .then ( (instance) => {
      return instance.target ();
    }).then ( (res) => {
      console.log ("@@@ ParamChangeRegistryForwarder target:",  res);
    });

  // call registry/construct via forwarder
  deployer.then (function () {
    return [MemeRegistryDb.deployed (),
            MemeRegistry.deployed (),
            MemeRegistryForwarder.deployed ()]
  }).then ( (promises) => {
    return Promise.all(promises);
  }).then (([memeRegistryDb,
             memeRegistry,
             memeRegistryForwarder]) => {
               var payload = memeRegistry.contract.construct.getData(memeRegistryDb.address);               
               return memeRegistryForwarder.sendTransaction({data: payload,
                                                             from: address});
             }).then ((tx) => {
               console.log ("@@@ MemeRegistry/construct tx", tx.receipt.transactionHash, "successful");
             });
  
  // call registry/construct via forwarder
  deployer.then (function () {
    return [ParamChangeRegistryDb.deployed (),
            ParamChangeRegistry.deployed (),
            ParamChangeRegistryForwarder.deployed ()];    
  }).then ( (promises) => {
    return Promise.all(promises);
  }).then (([paramChangeRegistryDb,
             paramChangeRegistry,
             paramChangeRegistryForwarder]) => {
               var payload = paramChangeRegistry.contract.construct.getData(paramChangeRegistryDb.address);               
               return paramChangeRegistryForwarder.sendTransaction({data: payload,
                                                                    from: address});
             }).then ((tx) => {
               console.log ("@@@ ParamChangeRegistryForwarder/construct tx", tx.receipt.transactionHash, "successful");
             });
  
  
  deployer.then (() => {
    return MemeRegistryForwarder.deployed ();
  }).then ((instance) => {
    return deployer.deploy (MemeToken, instance.address, opts);
  }).then ((memeToken) => {
    console.log ("@@@ MemeToken address", memeToken.address);
  });



  // TODO: link placehodlers
  // deployer.then ( () => {
  //   return [
  //     DankToken.deployed (),
  //     MemeRegistryForwarder.deployed (),
  //     DistrictConfig.deployed (),
  //     MemeToken.deployed ()
  //   ]
  // }).then ( (promises) => {
  //   Promise.all(promises).then ( ([
  //     dankToken,
  //     memeRegistryForwarder,
  //     districtConfig,
  //     memeToken
  //   ]) => {

  //     console.log ("@@@ linker",
  //                  dankToken.address,
  //                  memeRegistryForwarder.address,
  //                  districtConfig.address,
  //                  memeToken.address
  //                 );

  //     // linkBytecode.replace(Meme, dankTokenPlaceholder, dankToken.address);
  //     // linkBytecode.replace(Meme, registryPlaceholder, memeRegistryForwarder.address);
  //     // linkBytecode.replace(Meme, districtConfigPlaceholder, districtConfig.address);
  //     // linkBytecode.replace(Meme, memeTokenPlaceholder, memeToken.address);

  //   });
  // });





  // // console.log (Meme.bytecode);

  // // deployer.deploy (Meme, opts)
  // // deployer.deploy (ParamChange, opts)
  // // deployer.deploy (MemeFactory, opts)
  // // deployer.deploy (ParamChangeFactory, opts)

  // // EternalDb/setInt values



  // deployer.deploy (MemeAuctionFactoryForwarder, opts).then(function (instance) {
  //   console.log ('@@@ MemeAuctionFactoryForwarder address',  instance.address);
  // });

  deployer.then (function () {
    console.log ("Done");
  });


}
