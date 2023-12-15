import { config } from "../lib/config";
import React, { createContext, useContext, useEffect, useState } from "react";


const zeroTrustConfigContext = createContext({
  accountFactoryAddress:'',
  entryPointAddress:'',
  ztRegistryAddress:'',
  chain: '',
});

export const useZeroTrustConfig = () => {
  const context = useContext(zeroTrustConfigContext);
  if (!context) {
    throw new Error("useZeroTrustConfig must be used within a ZeroTrustConfigProvider");
  }
  return context;
};

export const ZeroTrustConfigProvider = ({ children }) => {
  const defaultChain = '0x14a33' //Goerli-Base
  const [accountFactoryAddress, setAccountFactoryAddress] = useState<string>()
  const [entryPointAddress, setEntryPointAddress] = useState<string>()
  const [ztRegistryAddress, setZTRegistryAddress] = useState<string>()
  const [chain, setChain] = useState<string>()

  useEffect(() => {
    const setConfigData = () => {
      setAccountFactoryAddress(config[defaultChain].accountFactoryAddress);
      setEntryPointAddress(config[defaultChain].entryPointAddress);
      setZTRegistryAddress(config[defaultChain].ztRegistryAddress);
      setChain(defaultChain);
    };
    
    setConfigData();
  }, []);
  

  const value = {
    accountFactoryAddress,
    entryPointAddress,
    ztRegistryAddress,
    chain
  };

  return <zeroTrustConfigContext.Provider value={value}>{children}</zeroTrustConfigContext.Provider>;
};
