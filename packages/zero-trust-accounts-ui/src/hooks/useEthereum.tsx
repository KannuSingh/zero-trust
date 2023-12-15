import { Network, ethers } from "ethers";
import React, { createContext, useContext, useEffect, useState } from "react";

type EthereumContextType = {
  ethereumProvider:ethers.JsonRpcProvider
  bundlerProvider:ethers.JsonRpcProvider
  paymasterProvider:ethers.JsonRpcProvider
}

const ethereumContext = createContext<EthereumContextType>({
  ethereumProvider:null,
  bundlerProvider:null,
  paymasterProvider:null,
});

export const useEthereum = () => {
  const context = useContext(ethereumContext);
  if (!context) {
    throw new Error("useEthereum must be used within a EthereumProvider");
  }
  return context;
};

export const EthereumProvider = ({ children }) => {
  const [ethereumProvider, setEthereumProvider] = useState<ethers.JsonRpcProvider>()
  const [bundlerProvider, setBundlerProvider] = useState<ethers.JsonRpcProvider>()
  const [paymasterProvider, setPaymasterProvider] = useState<ethers.JsonRpcProvider>()

  
  useEffect(() => {
    const setProvidersData = async () => {
      const _ethereumProvider = new ethers.JsonRpcProvider(
        "https://goerli.base.org", new Network("Goerli-Base","0x14a33")
      );
      const _chain = "base-goerli";
      const apiKey = process.env.REACT_APP_PIMLICO_API_KEY;
      const pimlicoEndpoint = `https://api.pimlico.io/v1/${_chain}/rpc?apikey=${apiKey}`;
      const _bundlerProvider = new ethers.JsonRpcProvider(
        pimlicoEndpoint,
        null,
        { 
          staticNetwork:  await _ethereumProvider.getNetwork() 
        }
      );
      const _paymasterProvider = new ethers.JsonRpcProvider(
        pimlicoEndpoint,
        null,
        {
          staticNetwork:  await _ethereumProvider.getNetwork() 
        }
      );
    
      setEthereumProvider(_ethereumProvider);
      setBundlerProvider(_bundlerProvider);
      setPaymasterProvider(_paymasterProvider);
    };
    
    setProvidersData();
  }, []);
  

  const value = {
    ethereumProvider,
    bundlerProvider,
    paymasterProvider,
  };

  return <ethereumContext.Provider value={value}>{children}</ethereumContext.Provider>;
};
