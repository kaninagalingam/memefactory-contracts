const {copy, linkBytecode} = require ("./utils.js");
const fs = require('fs');

const DSGuard = artifacts.require("DSGuard");
const MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
const DankToken = artifacts.require("DankToken");
const DistrictConfig = artifacts.require("DistrictConfig");

// copy artifacts for placeholder replacements
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

copy ("MemeToken", "MemeTokenCp");
const MemeToken = artifacts.require("MemeTokenCp");

copy ("Meme", "MemeCp");
const Meme = artifacts.require("MemeCp");

copy ("ParamChange", "ParamChangeCp");
const ParamChange = artifacts.require("ParamChangeCp");

copy ("MemeFactory", "MemeFactoryCp");
const MemeFactory = artifacts.require("MemeFactoryCp");

copy ("ParamChangeFactory", "ParamChangeFactoryCp")
const ParamChangeFactory = artifacts.require("ParamChangeFactoryCp");

copy ("MutableForwarder", "MemeAuctionFactoryForwarder");
const MemeAuctionFactoryForwarder = artifacts.require("MemeAuctionFactoryForwarder");

copy ("MemeAuctionFactory", "MemeAuctionFactoryCp");
const MemeAuctionFactory = artifacts.require("MemeAuctionFactoryCp");

copy ("MemeAuction", "MemeAuctionCp");
const MemeAuction = artifacts.require("MemeAuctionCp");

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
    console.log("@@@ DSGuard/setAuthority transaction", tx.receipt.transactionHash, "succesful");
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
  }).then ((
    [dSGuard,
     districtConfig]) => {
       return districtConfig.setAuthority(dSGuard.address, opts);
     }).then ((tx) => {
       console.log("@@@ DSGuard/setAuthority transaction", tx.receipt.transactionHash, "succesful");
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
    linkBytecode(ParamChangeRegistryForwarder, forwarderTargetPlaceholder, instance.address);
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
  }).then ((
    [memeRegistryDb,
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
  }).then ((
    [paramChangeRegistryDb,
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

  // link placehodlers
  deployer.then ( () => {
    return [DankToken.deployed (),
            MemeRegistryForwarder.deployed (),
            DistrictConfig.deployed (),
            MemeToken.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [dankToken,
     memeRegistryForwarder,
     districtConfig,
     memeToken]) => {
       linkBytecode(Meme, dankTokenPlaceholder, dankToken.address);
       linkBytecode(Meme, registryPlaceholder, memeRegistryForwarder.address);
       linkBytecode(Meme, districtConfigPlaceholder, districtConfig.address);
       linkBytecode(Meme, memeTokenPlaceholder, memeToken.address);
     });
  deployer.deploy(Meme, opts);

  // link placehodlers
  deployer.then (() => {
    return [DankToken.deployed (),
            ParamChangeRegistryForwarder.deployed ()];
  }).then ((promises) => {
    return Promise.all (promises);
  }).then ((
    [dankToken,
     paramChangeRegistryForwarder]) => {

       linkBytecode(ParamChange, dankTokenPlaceholder, dankToken.address);
       linkBytecode(ParamChange, registryPlaceholder, paramChangeRegistryForwarder.address);

       // console.log( dankTokenPlaceholder, dankToken.address);
       // console.log( registryPlaceholder, paramChangeRegistryForwarder.address);
       // console.log (ParamChange.bytecode);

     });
  deployer.deploy (ParamChange, opts);

  // link placehodlers
  deployer.then (() => {
    return Meme.deployed ();
  }).then ((meme) => {
    linkBytecode(MemeFactory, forwarderTargetPlaceholder, meme.address);
  });

  deployer.then (() => {
    return [MemeRegistryForwarder.deployed (),
            DankToken.deployed (),
            MemeToken.deployed ()];
  }).then ((
    [memeRegistryForwarder,
     dankToken,
     memeToken]) => {
       return deployer.deploy (MemeFactory, memeRegistryForwarder.address, dankToken.address, memeToken.address, opts);
     }).then ((memeFactory) => {
       console.log ("@@@ MemeFactory address", memeFactory.address);
     });

  // link placehodlers
  deployer.then (() => {
    return ParamChange.deployed ();
  }).then ((instance) => {
    linkBytecode(ParamChangeFactory, forwarderTargetPlaceholder, instance.address);
  });

  deployer.then (() => {
    return [ParamChangeRegistry.deployed (),
            DankToken.deployed ()];
  }).then ((
    [paramChangeRegistry,
     dankToken]) => {
       return deployer.deploy (ParamChangeFactory, paramChangeRegistry.address, dankToken.address, opts);
     }).then ((instance) => {
       console.log ("@@@ ParamChangeFactory address", instance.address);
     });

  // MemeRegistryDb/setInt values
  deployer.then (() => {
    return MemeRegistryDb.deployed ();
  }).then ((instance) => {
    return instance.setUIntValues (['challengePeriodDuration',
                                    'commitPeriodDuration',
                                    'revealPeriodDuration',
                                    'deposit',
                                    'challengeDispensation',
                                    'voteQuorum',
                                    'maxTotalSupply',
                                    'maxAuctionDuration'].map (web3.sha3),
                                   [600,
                                    600,
                                    600,
                                    "1000000000000000000",
                                    50,
                                    50,
                                    10,
                                    12096000],
                                   opts);
  }).then ((tx) => {
    console.log ("@@@ MemeRegistryDb/setUintValues tx", tx.receipt.transactionHash, "successful");
  });

  // ParamChangeRegistryDb/setInt values
  deployer.then (() => {
    return ParamChangeRegistryDb.deployed ();
  }).then ((instance) => {
    return instance.setUIntValues (['challengePeriodDuration',
                                    'commitPeriodDuration',
                                    'revealPeriodDuration',
                                    'deposit',
                                    'challengeDispensation',
                                    'voteQuorum'].map (web3.sha3),
                                   [600,
                                    600,
                                    600,
                                    "1000000000000000000",
                                    50,
                                    50],
                                   opts);
  }).then ((tx) => {
    console.log ("@@@ ParamChangeRegistryDb/setUintValues tx", tx.receipt.transactionHash, "successful");
  });

  // make :ds-guard authority of :meme-registry-db
  deployer.then (() => {
    return [DSGuard.deployed (),
            MemeRegistryDb.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [dSGuard,
     memeRegistryDb]) => {
       return memeRegistryDb.setAuthority(dSGuard.address, opts);
     }).then ((tx) => {
       console.log("@@@ MemeRegistryDb/setAuthority transaction", tx.receipt.transactionHash, "succesfull");
     });

  // make :ds-guard authority of :param-change-registry-db
  deployer.then (() => {
    return [DSGuard.deployed (),
            ParamChangeRegistryDb.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [dSGuard,
     paramChangeRegistryDb]) => {
       return paramChangeRegistryDb.setAuthority(dSGuard.address, opts);
     }).then ((tx) => {
       console.log("@@@ ParamChangeRegistryDb/setAuthority transaction", tx.receipt.transactionHash, "succesful");
     });

  // After authority is set, we can clean owner. Not really essential, but extra safety measure
  deployer.then (() => {
    return MemeRegistryDb.deployed ();
  }).then ((instance) => {
    return instance.setOwner (0, opts);
  }).then ((tx) => {
    console.log ("@@@ MemeRegistryDb/setOwner tx", tx.receipt.transactionHash, "successful");
  });

  deployer.then (() => {
    return ParamChangeRegistryDb.deployed ();
  }).then ((instance) => {
    return instance.setOwner (0, opts);
  }).then ((tx) => {
    console.log ("@@@ ParamChangeRegistryDb/setOwner tx", tx.receipt.transactionHash, "successful");
  });

  // allow :meme-registry-fwd to make changes into :meme-registry-db
  deployer.then (() => {
    return [DSGuard.deployed (),
            MemeRegistryForwarder.deployed (),
            MemeRegistryDb.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [dSGuard,
     memeRegistryForwarder,
     memeRegistryDb]) => {
       return dSGuard.permit(memeRegistryForwarder.address, memeRegistryDb.address, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', opts);
     }).then ((tx) => {
       console.log("@@@ DSGuard/permit transaction", tx.receipt.transactionHash, "succesful");
     });

  // allow :param-change-registry-fwd to make changes into :param-change-registry-db
  deployer.then (() => {
    return [DSGuard.deployed (),
            ParamChangeRegistryForwarder.deployed (),
            ParamChangeRegistryDb.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [dSGuard,
     paramChangeRegistryForwarder,
     paramChangeRegistryDb]) => {
       return dSGuard.permit(paramChangeRegistryForwarder.address, paramChangeRegistryDb.address, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', opts);
     }).then ((tx) => {
       console.log("@@@ DSGuard/permit transaction", tx.receipt.transactionHash, "succesful");
     });

  // allow :param-change-registry-fwd to make changes into :meme-registry-db (to apply ParamChanges)
  deployer.then (() => {
    return [DSGuard.deployed (),
            ParamChangeRegistryForwarder.deployed (),
            MemeRegistryDb.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [dSGuard,
     paramChangeRegistryForwarder,
     memeRegistryDb]) => {
       return dSGuard.permit(paramChangeRegistryForwarder.address, memeRegistryDb.address, '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', opts);
     }).then ((tx) => {
       console.log("@@@ DSGuard/permit transaction", tx.receipt.transactionHash, "succesful");
     });

  // call Registry/setFactory via Forwarder
  deployer.then (function () {
    return [MemeRegistryForwarder.deployed (),
            MemeRegistry.deployed (),
            MemeFactory.deployed ()]
  }).then ( (promises) => {
    return Promise.all(promises);
  }).then ((
    [memeRegistryForwarder,
     memeRegistry,
     memeFactory
    ]) => {
      var payload = memeRegistry.contract.setFactory.getData(memeFactory.address, true);
      // console.log ("@@@ PAYLOAD", payload);
      return memeRegistryForwarder.sendTransaction({data: payload,
                                                    from: address});
    }).then ((tx) => {
      console.log ("@@@ MemeRegistry/setFactory tx", tx.receipt.transactionHash, "successful");
    });

  // call Registry/setFactory via Forwarder
  deployer.then (function () {
    return [ParamChangeRegistryForwarder.deployed (),
            ParamChangeRegistry.deployed (),
            ParamChangeFactory.deployed ()]
  }).then ( (promises) => {
    return Promise.all(promises);
  }).then ((
    [paramChangeRegistryForwarder,
     paramChangeRegistry,
     paramChangeFactory
    ]) => {

      var payload = paramChangeRegistry.contract.setFactory.getData(paramChangeFactory.address, true);

      // console.log ("@@@ PAYLOAD",
      //              paramChangeRegistryForwarder.address,
      //              paramChangeRegistry.address,
      //              paramChangeFactory.address,
      //              payload);

      return paramChangeRegistryForwarder.sendTransaction({data: payload,
                                                           from: address});
    }).then ((tx) => {
      console.log ("@@@ ParamChangeRegistry/setFactory tx", tx.receipt.transactionHash, "successful");
    });

  deployer.deploy (MemeAuctionFactoryForwarder, opts);

  // give DSGuard authority over MemeAuctionForwarder
  deployer.then (() => {
    return [DSGuard.deployed (),
            MemeAuctionFactoryForwarder.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [dSGuard,
     memeAuctionFactoryForwarder]) => {
       return memeAuctionFactoryForwarder.setAuthority(dSGuard.address, opts);
     }).then ((tx) => {
       console.log("@@@ DSGuard/setAuthority transaction", tx.receipt.transactionHash, "succesful");
     });

  // link placehodlers
  deployer.then ( () => {
    return [MemeAuctionFactoryForwarder.deployed (),
            MemeRegistryForwarder.deployed (),
            DistrictConfig.deployed (),
            MemeToken.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [memeAuctionFactoryForwarder,
     memeRegistryForwarder,
     districtConfig,
     memeToken]
  ) => {
    linkBytecode(MemeAuction, memeAuctionFactoryPlaceholder, memeAuctionFactoryForwarder.address);
    linkBytecode(MemeAuction, registryPlaceholder, memeRegistryForwarder.address);
    linkBytecode(MemeAuction, districtConfigPlaceholder, districtConfig.address);
    linkBytecode(MemeAuction, memeTokenPlaceholder, memeToken.address);

    // console.log (MemeAuction.bytecode);

    // console.log ('@@@ REPLACEMENT', memeAuctionFactoryForwarder.address,
    //              memeRegistryForwarder.address,
    //              districtConfig.address,
    //              memeToken.address);

  });
  deployer.deploy(MemeAuction, opts);

  deployer.then (() => {
    return MemeAuction.deployed ();
  }).then ((instance) => {
    linkBytecode(MemeAuctionFactory, forwarderTargetPlaceholder, instance.address);
  });
  deployer.deploy(MemeAuctionFactory, opts);

  // set factory as target for forwarder
  deployer.then (() => {
    return [MemeAuctionFactory.deployed (),
            MemeAuctionFactoryForwarder.deployed ()];
  }).then ((promises) => {
    return Promise.all(promises);
  }).then ((
    [memeAuctionFactory,
     memeAuctionFactoryForwarder]) => {
       return memeAuctionFactoryForwarder.setTarget(memeAuctionFactory.address, opts);
     }).then ((tx) => {
       console.log("@@@ MemeAuctionFactoryForwarder/setTarget transaction", tx.receipt.transactionHash, "succesful");
     });

  deployer.then (() => {
    return MemeAuctionFactoryForwarder.deployed ();
  }).then ((instance) => {
    return instance.target ();
  }).then ( (res) => {
    console.log ("@@@ MemeAuctionFactoryForwarder target:",  res);
  });

  // call construct via forwarder
  deployer.then (function () {
    return [MemeToken.deployed (),
            MemeAuctionFactory.deployed (),
            MemeAuctionFactoryForwarder.deployed ()]
  }).then ( (promises) => {
    return Promise.all(promises);
  }).then ((
    [memeToken,
     memeAuctionFactory,
     memeAuctionFactoryForwarder]) => {
       var payload = memeAuctionFactory.contract.construct.getData(memeToken.address);

       // console.log ('@@@ PAYLOAD', payload);

       return memeAuctionFactoryForwarder.sendTransaction({data: payload,
                                                           from: address});
     }).then ((tx) => {
       console.log ("@@@ MemeAuctionFactory/construct tx", tx.receipt.transactionHash, "successful");
     });

  deployer.then (() => {
    return DankToken.deployed ();
  }).then ((instance) => {
    return instance.balanceOf (address, opts);
  }).then ( (res) => {
    console.log ("@@@ DANK balance of:", address, res);
  });

  // TODO: generate json -> edn
  deployer.then (function () {
    return [
      DSGuard.deployed (),
      MiniMeTokenFactory.deployed (),
      DankToken.deployed (),
      DistrictConfig.deployed (),
      MemeRegistryDb.deployed (),
      ParamChangeRegistryDb.deployed (),
      MemeRegistry.deployed (),
      ParamChangeRegistry.deployed (),
      MemeRegistryForwarder.deployed (),
      ParamChangeRegistryForwarder.deployed (),
      MemeToken.deployed (),
      Meme.deployed (),
      ParamChange.deployed (),
      MemeFactory.deployed (),
      ParamChangeFactory.deployed (),
      MemeAuctionFactoryForwarder.deployed (),
      MemeAuctionFactory.deployed (),
      MemeAuction.deployed ()];
  }).then ( (promises) => {
    return Promise.all(promises);
  }).then ((
    [dSGuard,
     miniMeTokenFactory,
     dankToken,
     districtConfig,
     memeRegistryDb,
     paramChangeRegistryDb,
     memeRegistry,
     paramChangeRegistry,
     memeRegistryForwarder,
     paramChangeRegistryForwarder,
     memeToken,
     meme,
     paramChange,
     memeFactory,
     paramChangeFactory,
     memeAuctionFactoryForwarder,
     memeAuctionFactory,
     memeAuction]) => {

       var smartContracts = JSON.stringify ({
         "DistrictConfig": {"name" : "DistrictConfig",
                            "address" : districtConfig.address},
         "DSGuard": {"name" : "DSGuard",
                     "address": dSGuard.address},
         "ParamChangeRegistry": {"name" : "ParamChangeRegistry",
                                 "address": paramChangeRegistry.address},
         "ParamChangeRegistryDb": {"name" : "EternalDB",
                                   "address": paramChangeRegistryDb.address},
         "MemeRegistryDb": {"name" : "EternalDB",
                            "address" : memeRegistryDb.address},
         "ParamChange": {"name" : "ParamChange",
                         "address" : paramChange.address},
         "MinimeTokenFactory": {"name" : "MiniMeTokenFactory",
                                "address" : miniMeTokenFactory.address},
         "MemeAuctionFactory": {"name" : "MemeAuctionFactory",
                                "address" : memeAuctionFactory.address},
         "MemeAuction": {"name" : "MemeAuction",
                         "address" : memeAuction.address},
         "ParamChangeFactory": {"name" : "ParamChangeFactory",
                                "address": paramChangeFactory.address},
         "ParamChangeRegistryFwd": {"name" : "MutableForwarder",
                                    "address" : paramChangeRegistryForwarder.address},
         "MemeFactory": {"name": "MemeFactory",
                         "address" : MemeFactory.address},
         "MemeToken": {"name" : "MemeToken",
                       "address" : memeToken.address},
         "DANK": {"name" : "DankToken",
                  "address" : dankToken.address},
         "MemeRegistry": {"name" : "Registry",
                          "address" : memeRegistry.address},
         "Meme" : {"name" : "Meme",
                   "address": meme.address},
         "MemeRegistryFwd" : {"name" : "MutableForwarder",
                              "address" : memeRegistryForwarder.address},
         "MemeAuctionFactoryFwd" : {"name" : "MutableForwarder",
                                    "address" : memeAuctionFactoryForwarder.address}});

       console.log (smartContracts);

       console.log (fs);
       fs.writeFile('smartContracts.json', smartContracts);       
     });

  deployer.then (function () {
    console.log ("Done");
  });

}
