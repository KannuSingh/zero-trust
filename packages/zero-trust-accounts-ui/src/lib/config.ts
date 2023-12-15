type AppConfig = {
  name: string;
  nativeTokenSymbol: string;
  entryPointAddress:string;
  accountFactoryAddress:string;
  ztRegistryAddress:string;
  chainBlockExplorerUrl: string;
  pimlicoBundlerRpc:string;
  chainRpc: string;
}

type Config = {
  [key: string]: AppConfig;
}

export const config: Config = {
  '0x14a33': {
    name: 'Goerli Base',
    nativeTokenSymbol: 'BaseETH',
    entryPointAddress:'0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
    accountFactoryAddress: '0xBaCb467F8ec1D38EC874b95220e06F4F35E7ca9f', //'0x36cb2bF3E6939349270d5c84F9210C7CCE2A3855',
    ztRegistryAddress:'0xF02115AD9d49196B1a6113fE2366B9A3ECe566ca',
    pimlicoBundlerRpc:`https://api.pimlico.io/v1/base-goerli/rpc?apikey=${process.env.REACT_APP_PIMLICO_API_KEY }`,
    chainBlockExplorerUrl: 'https://goerli.basescan.org',
    chainRpc: 'https://goerli.base.org',
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