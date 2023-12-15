import { Contract,Provider,Signer} from "ethers"
import DEMO_NFT_ABI from "./abis/DemoNFT.json"
import { getStateMutatingFunctions } from "../utils"
import { DemoNFT } from "./types/DemoNFT"
import ENTRY_POINT_ABI from "./abis/EntryPoint.json"
import { EntryPoint } from "./types/EntryPoint";

// GENERATE THE INITCODE
const ENTRY_POINT_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

export function getEntryPointContract(signerOrProvider:Provider){
    return new Contract(ENTRY_POINT_ADDRESS, ENTRY_POINT_ABI, signerOrProvider) as unknown as EntryPoint
}
export function getDemoNFTContract(address:string,signerOrProvider: Provider|Signer):DemoNFT  {
  return  new Contract(address, DEMO_NFT_ABI, signerOrProvider) as unknown as DemoNFT 
}

export function getApplicationScope()  {
  return  getStateMutatingFunctions(DEMO_NFT_ABI)
}