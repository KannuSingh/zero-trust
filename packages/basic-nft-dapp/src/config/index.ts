export type ApplicationScope = {
  [contract:string] : {
    name:string,
    selector:string
  }[]
}

export const exampleMintDappScope:ApplicationScope =  {
    '0xC29413bfbF9773DbC45Cc9C8A82b0d89f66Fe83F':[
      {
      name:'mintNFT',
      selector:'0xeacabe14'
      },
      {
        name:'transferFrom',
        selector:'0x23b872dd'
      }
    ]
  }

  interface ChainConfig {
    name: string;
    entryPointContractAddress:string;
    demoNFTContractAddress:string;
    passkeyZkAccountFactory:string;
    accountRegistryContractAddress:string;
    symbol: string;
    pimlicoChainValue:string;
    blockExplorer: string;
    rpcUrl: string;
  }
  
  interface Config {
    [key: string]: ChainConfig;
  }
  
  export const config: Config = {
    '0x14a33': {
      name: 'Goerli Base',
      entryPointContractAddress:'0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
      demoNFTContractAddress:'0xC29413bfbF9773DbC45Cc9C8A82b0d89f66Fe83F',
      passkeyZkAccountFactory:'0x022bD598De02952104708657a3d1219596bb6aE1',//'0x1DFb3Fc1155D4564FEfcf3d1b67cDdc2C2867f22',
      accountRegistryContractAddress:'0x111b49e8AF0dAbc434E371F57C277f8916080d82',//'0x00022c2Ff80cfAA0E5eC703B0e163981a2B6AE30',
      symbol: 'BaseETH',
      pimlicoChainValue:'base-goerli',
      blockExplorer: 'https://goerli.basescan.org',
      rpcUrl: 'https://goerli.base.org',
    }
  }
  
  export const isSupportedNetwork = (id: string) => {
    if (!id) {
      return false;
    }
    const isHexChain = id.startsWith('0x');
    const networkId = isHexChain ? id : `0x${Number(id).toString(16)}`;
    return !!(networkId in config );
  }
  
  
  export const getEntryPointContractAddressByChainId = (chainId: string): string | undefined => {
    const chainConfig = config[chainId];
    if (chainConfig && isSupportedNetwork(chainId)) {
      return chainConfig.entryPointContractAddress
    } else {
      return ''; // Chain ID not found in config
    }
  }
  export const getPimlicoChainNameByChainId = (chainId: string): string | undefined => {
    const chainConfig = config[chainId];
    if (chainConfig && isSupportedNetwork(chainId)) {
      return chainConfig.pimlicoChainValue
    } else {
      return ''; // Chain ID not found in config
    }
  }
  export const getChainConfigForChainId = (chainId: string): ChainConfig | undefined=> {
    const chainConfig = config[chainId];
    if (chainConfig && isSupportedNetwork(chainId)) {
      return chainConfig;
    } 
  }
  
  export const getDemoNFTContractAddressByChainId = (chainId: string): string | undefined => {
    const chainConfig = config[chainId];
    
    if (chainConfig && isSupportedNetwork(chainId)) {
      return chainConfig.demoNFTContractAddress;
    } 
  }
  export const getBlockExplorerURLByChainId = (chainId: string): string | undefined => {
    const chainConfig = config[chainId];
    if (chainConfig && isSupportedNetwork(chainId)) {
      return chainConfig.blockExplorer;
    } 
  }
  
  
