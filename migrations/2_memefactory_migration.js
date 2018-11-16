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
  const gas = 4612388;
  const opts = {gas: gas, from: address};

  deployer.then (() => {
    console.log ("@@@ using Web3 version:", web3.version.api);
    console.log ("@@@ using address", address);
  });

  deployer.deploy (DSGuard, opts);

  // make deployed :ds-guard its own autority
  deployer.then (() => {
    return DSGuard.deployed ();
  }).then ((instance) => {
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
    linkBytecode(MemeRegistryForwarder, forwarderTargetPlaceholder, instance.address);
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
            // MemeRegistry.deployed (),
            MemeRegistryForwarder.deployed ()]
  }).then ( (promises) => {
    return Promise.all(promises);
  }).then ((
    [memeRegistryDb,
     // memeRegistry,
     memeRegistryForwarder]) => {
       var target = MemeRegistry.at (memeRegistryForwarder.address);
       return target.construct (memeRegistryDb.address, opts);
     }).then ((tx) => {
       console.log ("@@@ MemeRegistry/construct tx",
                    tx.receipt.transactionHash,
                    "successful");
     });

  // check
  deployer.then (() => {
    return MemeRegistryForwarder.deployed ();
  }).then ((instance) => {
    var target = MemeRegistry.at (instance.address);
    return target.db ();
  }).then ( (res) => {
    console.log ("@@@@ MemeRegistry/db :", res);
  });

  // call registry/construct via forwarder
  deployer.then (function () {
    return [ParamChangeRegistryDb.deployed (),
            ParamChangeRegistryForwarder.deployed ()];
  }).then ( (promises) => {
    return Promise.all(promises);
  }).then ((
    [paramChangeRegistryDb,
     paramChangeRegistryForwarder]) => {
       var target = ParamChangeRegistry.at (paramChangeRegistryForwarder.address);
       return target.construct (paramChangeRegistryDb.address, opts);
     }).then ((tx) => {
       console.log ("@@@ ParamChangeRegistryForwarder/construct tx", tx.receipt.transactionHash, "successful");
     });

  // check
  deployer.then (() => {
    return ParamChangeRegistryForwarder.deployed ();
  }).then ((instance) => {
    var target = ParamChangeRegistry.at (instance.address);
    return target.db ();
  }).then ( res => {
    console.log ("@@@@ ParamChangeRegistry/db :", res);
  });

  deployer.then (() => {
    return MemeRegistryForwarder.deployed ();
  }).then ((instance) => {
    return deployer.deploy (MemeToken, instance.address, opts);
  }).then ((memeToken) => {
    console.log ("@@@ MemeToken address", memeToken.address);
  });

  // check
  deployer.then (() => {
    return MemeToken.deployed ();
  }).then ((instance) => {
    return instance.registry();
  }).then ((res) => {
    console.log ("@@@ MemeToken/registry", res);
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

  // paramChangeRegistryDb/setInt values
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
  deployer.then (() => {
    return [MemeRegistryForwarder.deployed (),
            MemeFactory.deployed ()]
  }).then ( promises => {
    return Promise.all(promises);
  }).then ((
    [memeRegistryForwarder,
     memeFactory]) => {
       var target = MemeRegistry.at (memeRegistryForwarder.address);
       return target.setFactory (memeFactory.address, true, opts);
     }).then ((tx) => {
       console.log ("@@@ MemeRegistry/setFactory tx", tx.receipt.transactionHash, "successful");
     });

  // check
  deployer.then ( () => {
    return [MemeRegistryForwarder.deployed (),
            MemeFactory.deployed ()]
  }).then ( promises => Promise.all(promises))
    .then (([memeRegistryForwarder,
             memeFactory]) => {
               var target = MemeRegistry.at (memeRegistryForwarder.address);
               return target.isFactory (memeFactory.address);
             }).then (res => console.log ("@@@ MemeRegistry/isFactory", res));

  // call Registry/setFactory via Forwarder
  deployer.then (function () {
    return [ParamChangeRegistryForwarder.deployed (),
            ParamChangeFactory.deployed ()]
  }).then ( promises => Promise.all(promises))
    .then (([paramChangeRegistryForwarder,
             paramChangeFactory]) => {
               var target = ParamChangeRegistry.at (paramChangeRegistryForwarder.address);
               return target.setFactory (paramChangeFactory.address, true, opts);
             }).then ((tx) => {
               console.log ("@@@ ParamChangeRegistry/setFactory tx", tx.receipt.transactionHash, "successful");
             });

  // check
  deployer.then (function () {
    return [ParamChangeRegistryForwarder.deployed (),
            ParamChangeFactory.deployed ()]
  }).then ( promises => Promise.all(promises))
    .then (([paramChangeRegistryForwarder,
             paramChangeFactory]) => {
               var target = ParamChangeRegistry.at (paramChangeRegistryForwarder.address);
               return target.isFactory (paramChangeFactory.address);
             })
    .then ((res) => {
      console.log ("@@@@ ParamChangeRegistry/isFactory", res);
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
            MemeAuctionFactoryForwarder.deployed ()]
  }).then ( promises =>  Promise.all(promises))
    .then ((
      [memeToken,
       memeAuctionFactoryForwarder]) => {
         var target = MemeAuctionFactory.at (memeAuctionFactoryForwarder.address);
         return target.construct (memeToken.address, opts);
       }).then ((tx) => {
         console.log ("@@@ MemeAuctionFactory/construct tx", tx.receipt.transactionHash, "successful");
       });

  // check
  deployer.then (() => {
    return MemeAuctionFactoryForwarder.deployed ();
  }).then ((instance) => {
    var target = MemeAuctionFactory.at (instance.address);
    return target.memeToken ();
  }).then ( res => console.log ("@@@@ MemeAuctionFactory/memeToken :", res));

  deployer.then (() => {
    return DankToken.deployed ();
  }).then ((instance) => {
    return instance.transfer (accounts [9], 15000000000000000000000, opts);
  }).then ((tx) => {
    console.log ("@@@ DankToken/transfer tx", tx.receipt.transactionHash, "successful");
  });

  deployer.then (() => {
    return DankToken.deployed ();
  }).then ((instance) => {
    return [instance.balanceOf (address, opts),
            instance.balanceOf (accounts[9], opts)];
  }).then (promises =>  Promise.all (promises))
    .then ( (
      [balance0,
       balance9]) => {
         console.log ("@@@ DANK balance of:", address, balance0);
         console.log ("@@@ DANK balance of:", accounts [9], balance9);
       });

  // TODO: json -> edn
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
         "district-config" : {"name" : "DistrictConfig",
                              "address" : districtConfig.address},
         "ds-guard" : {"name" : "DSGuard",
                       "address": dSGuard.address},
         "param-change-registry" : {"name" : "ParamChangeRegistry",
                                    "address": paramChangeRegistry.address},
         "param-change-registry-db" : {"name" : "EternalDb",
                                       "address": paramChangeRegistryDb.address},
         "meme-registry-db" : {"name" : "EternalDb",
                               "address" : memeRegistryDb.address},
         "param-change" : {"name" : "ParamChange",
                           "address" : paramChange.address},
         "minime-token-factory" : {"name" : "MiniMeTokenFactory",
                                   "address" : miniMeTokenFactory.address},
         "meme-auction-factory" : {"name" : "MemeAuctionFactory",
                                   "address" : memeAuctionFactory.address},
         "meme-auction" : {"name" : "MemeAuction",
                           "address" : memeAuction.address},
         "param-change-factory" : {"name" : "ParamChangeFactory",
                                   "address": paramChangeFactory.address},
         "param-change-registry-fwd" : {"name" : "MutableForwarder",
                                        "address" : paramChangeRegistryForwarder.address},
         "meme-factory" : {"name": "MemeFactory",
                           "address" : MemeFactory.address},
         "meme-token" : {"name" : "MemeToken",
                         "address" : memeToken.address},
         "DANK" : {"name" : "DankToken",
                   "address" : dankToken.address},
         "meme-registry" : {"name" : "Registry",
                            "address" : memeRegistry.address},
         "meme" : {"name" : "Meme",
                   "address": meme.address},
         "meme-registry-fwd" : {"name" : "MutableForwarder",
                                "address" : memeRegistryForwarder.address},
         "meme-auction-factory-fwd" : {"name" : "MutableForwarder",
                                       "address" : memeAuctionFactoryForwarder.address}});
       console.log (smartContracts);
       fs.writeFile('smartContracts.json', smartContracts);
     });

  deployer.then (function () {
    console.log ("Done");
  });

}
