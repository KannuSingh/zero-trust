import { Contract,Provider,Signer} from "ethers"
import DEMO_NFT_ABI from "./abis/DemoNFT.json"
import { DemoNFT } from "./abis/types"

export function getDemoNFTContract(address:string,signerOrProvider: Provider|Signer):DemoNFT  {
  return  new Contract(address, DEMO_NFT_ABI, signerOrProvider) as unknown as DemoNFT 
}