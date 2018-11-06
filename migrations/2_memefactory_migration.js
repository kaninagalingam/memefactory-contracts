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
// const MemeAuctionFactoryForwarder = artifacts.require("MutableForwarder");
const MemeAuctionFactory = artifacts.require("MemeAuctionFactory");
const MemeAuction = artifacts.require("MemeAuction");

const registryPlaceholder = "feedfeedfeedfeedfeedfeedfeedfeedfeedfeed";
const dankTokenPlaceholder = "deaddeaddeaddeaddeaddeaddeaddeaddeaddead";
// const forwarderTargetPlaceholder = "beefbeefbeefbeefbeefbeefbeefbeefbeefbeef";
const districtConfigPlaceholder = "abcdabcdabcdabcdabcdabcdabcdabcdabcdabcd";
const memeTokenPlaceholder = "dabbdabbdabbdabbdabbdabbdabbdabbdabbdabb";
// const meme-auction-factory-placeholder = "daffdaffdaffdaffdaffdaffdaffdaffdaffdaff";

module.exports = function(deployer, network, accounts) {

  const address = accounts [0];
  const opts = {gas: 4612388, from: address};

  deployer.deploy (DSGuard, opts);

  deployer.then (function () {
    DSGuard.deployed ().then (function (instance) {
      instance.target().then (function (result) {
        instance.setAuthority(instance.address, opts);
      });
    });
  });

  deployer.deploy (MiniMeTokenFactory, opts);

  deployer.then (function () {
    MiniMeTokenFactory.deployed ().then (function (instance) {
      deployer.deploy (DankToken, instance.address, 1000000000000000000000000000, opts);
    })
  });

  deployer.deploy (DistrictConfig, accounts[0], accounts[0], 0, opts);

  // give dSGuard the authority over districtConfig
  deployer.then (function () {
    return [DSGuard.deployed (),
            DistrictConfig.deployed ()]
  }).then (function (promises) {
    Promise.all(promises).then (function ([dSGuard,
                                           districtConfig]) {
      districtConfig.setAuthority(dSGuard.address, opts);
    });
  });

  deployer.deploy (MemeRegistryDb, opts);
  deployer.deploy (ParamChangeRegistryDb, opts);

  deployer.deploy (MemeRegistry, opts);

  // deployer.link(
  //   MemeRegistry,
  //   // forwarderTargetPlaceholder,
  //   MemeRegistryForwarder
  // );

  deployer.deploy(MemeRegistryForwarder, opts);

  deployer.then (function () {
    return [MemeRegistry.deployed (),
            MemeRegistryForwarder.deployed ()]
  }).then (function (promises) {
    Promise.all(promises).then (function ([memeRegistry,
                                           memeRegistryForwarder]) {
      // console.log ("@@@ memeRegistryForwarder address", memeRegistryForwarder.address);
      memeRegistryForwarder.setTarget (memeRegistry.address, opts).then (function () {
        memeRegistryForwarder.target().then (function (result) {
          // console.log ("@@@ MemeRegistryForwarder target:",  result);
        });
      });
    });
  });

  deployer.deploy (ParamChangeRegistry, opts)
  deployer.deploy (ParamChangeRegistryForwarder, opts);

  deployer.then (function () {
    return [ParamChangeRegistry.deployed (),
            ParamChangeRegistryForwarder.deployed ()]
  }).then (function (promises) {
    Promise.all(promises).then (function ([paramChangeRegistry,
                                           paramChangeRegistryForwarder]) {
      // console.log ("@@@ paramChangeRegistryForwarder address", paramChangeRegistryForwarder.address);
      paramChangeRegistryForwarder.setTarget (paramChangeRegistry.address, opts);
    });
  });

  // TODO : registry/construct via forwarder
  deployer.then (function () {
    return [MemeRegistryDb.deployed (),
            MemeRegistry.deployed (),
            MemeRegistryForwarder.deployed ()]
  }).then (function (promises) {
    Promise.all(promises).then (function ([memeRegistryDb,
                                           memeRegistry,
                                           memeRegistryForwarder]) {
      var payload = memeRegistry.contract.construct.getData(memeRegistryDb.address, opts);
      memeRegistryForwarder.sendTransaction({data: payload})
        .then (function (tx) {
          // console.log ("@@@ MemeRegistry/construct tx", tx);
        });
    });
  });

  deployer.then (function () {
    return [ParamChangeRegistryDb.deployed (),
            ParamChangeRegistry.deployed (),
            ParamChangeRegistryForwarder.deployed ()]
  }).then (function (promises) {
    Promise.all(promises).then (function ([paramChangeRegistryDb,
                                           paramChangeRegistry,
                                           paramChangeRegistryForwarder]) {
      var payload = paramChangeRegistry.contract.construct.getData(paramChangeRegistryDb.address, opts);
      paramChangeRegistryForwarder.sendTransaction({data: payload})
        .then (function (tx) {
          // console.log ("@@@ ParamChangeRegistry/construct tx", tx);
        });
    });
  });

  // TODO : deployed?

  // deployer.deploy (MemeToken, "0x1ac9fbc996376e2e726635947d091c3a268fd36e", opts)
  //       .then (function (res) {
  //         console.log ("@@@ deployed MemeToken instance",  res);
  //       })
  
  deployer.then (function () {
    MemeRegistryForwarder.deployed ().then (function (instance) {

      console.log ("@@@ MemeRegistryForwarder address", instance.address);
      
      // deployer.deploy (MemeToken, instance.address, opts)
      // .then (function (res) {
      //     console.log ("@@@ deployed MemeToken instance",  res);
      //   });
                 
    });
  });


  
  // console.log ("@@@ MemeToken ", MemeToken);
  MemeToken.deployed ().then (function (instance) {
    console.log ("@@@ MemeToken address", instance.address);    
  });

  


  
  // TODO: link placehodlers
  deployer.then (function () {
    return [
      DankToken.deployed (),
      MemeRegistryForwarder.deployed (),
      DistrictConfig.deployed (),
      // MemeToken.deployed ()
    ]
  }).then (function (promises) {
    Promise.all(promises).then (function ([
      dankToken,
      memeRegistryForwarder,
      districtConfig,
      // memeToken
    ]) {

      console.log ("@@@ linker",
                   dankToken.address,
                   memeRegistryForwarder.address,
                   districtConfig.address,
                   // memeToken.address
                  );
      
      // linkBytecode.replace(Meme, dankTokenPlaceholder, dankToken.address);
      // linkBytecode.replace(Meme, registryPlaceholder, memeRegistryForwarder.address);
      // linkBytecode.replace(Meme, districtConfigPlaceholder, districtConfig.address);
      // linkBytecode.replace(Meme, memeTokenPlaceholder, memeToken.address);
      
    });
  });



  
  
  // console.log (Meme.bytecode);



  
  // deployer.deploy (Meme, opts)
  // deployer.deploy (ParamChange, opts)
  // deployer.deploy (MemeFactory, opts)
  // deployer.deploy (ParamChangeFactory, opts)

// EternalDb/setInt values








  


  deployer.then (function () {
    console.log ("Done");
  });


}
