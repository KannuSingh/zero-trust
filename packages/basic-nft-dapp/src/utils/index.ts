import { logger } from '../config/logger';
import {Contract, Interface, InterfaceAbi } from "ethers"

export const formatTime = (seconds:number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let formattedTime = '';

  if (hours > 0) {
    formattedTime += `${hours}h `;
  }

  if (minutes > 0) {
    formattedTime += `${minutes}m `;
  }

  if (remainingSeconds > 0 || formattedTime === '') {
    formattedTime += `${remainingSeconds}s`;
  }

  return formattedTime.trim();
};


export const getNonceValue = async (c:Contract) => {
  let nonceValue = 0;
  try {
    nonceValue = await c['getNonce']();
    
  } catch (error) {
    logger.info("Error fetching nonce:", error);
  }finally{
    return nonceValue
  }
}

export function formatAddress(address:string){
  if(address && address.length > 10)
    return `${address.toString().substring(0, 6)}...${address.toString().substring(38)}`
  return address
}

export function getStateMutatingFunctions(abi:InterfaceAbi){
  const stateMutatingMethods: { name: string; selector: string }[] = [];
  const abiInterface = new Interface(abi);
  abiInterface.forEachFunction((functionFragment,index)=>{
    if(functionFragment.stateMutability === "nonpayable" || functionFragment.stateMutability === "payable" )
      console.log(`${functionFragment.name} => ${functionFragment.selector}`)
      stateMutatingMethods.push({
        name: functionFragment.name,
        selector: functionFragment.selector,
      });
  })
  return stateMutatingMethods;
}