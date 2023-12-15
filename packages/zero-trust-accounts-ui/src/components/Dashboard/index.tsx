import { useZeroTrustConfig } from "../../hooks/useZeroTrustConfig";
import { useEthereum } from "../../hooks/useEthereum";
import { Alert, AlertIcon, Button, Flex, FormControl, Input, InputGroup, InputRightAddon, Text, useToast } from "@chakra-ui/react";
import { Passkey,ZeroTrustAccount,getAccountRegistryContract} from 'zero-trust-core-sdk';
import { ethers } from "ethers";
import { useLocalStorage } from "usehooks-ts";
import { LocalPasskeyMetaInfoMap } from "../../pages/signup";
import { useParams } from "react-router-dom";
import { useState } from "react";

const Dashboard = () => {
  const toast = useToast();
  const {dataSource,name} = useParams();
  const {ethereumProvider,bundlerProvider,paymasterProvider} = useEthereum() 
  const {accountFactoryAddress,entryPointAddress,ztRegistryAddress} = useZeroTrustConfig();
  const [localPasskeyMetaInfoMap,]= useLocalStorage<LocalPasskeyMetaInfoMap>("localPasskeyMetaInfoMap",{})
  const [isLoading,setIsLoading] = useState(false)
  const [username,setUsername] = useState<string>("")


  const handleClaimUsername = async () => {
    setIsLoading(true)
    if(dataSource === "local" && localPasskeyMetaInfoMap[name] && username.length > 3){
      
      // Get the passkey details for the local user who is claiming the username
      const publicKey = Passkey.hex2buf(localPasskeyMetaInfoMap[name].publicKeyAsHex);
      const publicKeyAsCryptoKey = await Passkey.importPublicKeyAsCryptoKey(  publicKey );
      const [pubKeyX,pubKeyY] = await Passkey.getPublicKeyXYCoordinate(publicKeyAsCryptoKey)
      const credentialId = ethers.toUtf8Bytes(localPasskeyMetaInfoMap[name].credentialId)
      
      // prepare calldata to execute via account
      const usernameHash = ethers.keccak256(ethers.toUtf8Bytes(`${username}@zt.eth`))
      const signerInfo = {
        signerType: 0, // enum AccountType{PASSKEY}
        pubKeyX: pubKeyX,
        pubKeyY: pubKeyY,
        id: credentialId,
        domainUrl: ethers.toUtf8Bytes(window.location.origin),
      };
      const simpleAccountRegistryContract = getAccountRegistryContract(ztRegistryAddress,ethereumProvider);
      const claimUsernameCalldata = simpleAccountRegistryContract.interface.encodeFunctionData("addAccountMetaInfo",[usernameHash,signerInfo]) 
    
      //use zerotrust account to execute the claimUsernameCalldata
      const passkeyMetaInfo= {
        pubKeyX,
        pubKeyY,
        salt:0,
        credentialId
      }
      const zerotrustAccount = new ZeroTrustAccount(ethereumProvider,entryPointAddress,accountFactoryAddress,passkeyMetaInfo)
      const {response,error} = await zerotrustAccount.execute(ztRegistryAddress,claimUsernameCalldata,bundlerProvider,paymasterProvider);
      console.log(`https://goerli.basescan.org/tx/${response.receipt.transactionHash}`)
      if(error || !response.success){
        toast(
          {
            title: "Failed to registered username",
            description: "",
            status: "error",
            duration: 9000,
            isClosable: true,
          })
          
      }else{
        toast(
          {
            title: "Successfully Registered account",
            description: "",
            status: "success",
            duration: 9000,
            isClosable: true,
          })
      }
      
    }
    // Logic to handle claiming username
    setIsLoading(false)
  };

  return (
    <Flex direction="column" gap={2}>
      <Text>
        Welcome,
      </Text>
      <Text>
        To get started, claim your username to have unrestricted access to your account accross devices.
      </Text>
      
      <Flex mt={4} gap={2} direction={{ base: "column", md: "row" }}>
        <FormControl >
          <InputGroup>
            <Input id="username" type="text" value={username}
              onChange={(e)=> setUsername(e.target.value)}
              textAlign={'right'} />
            <InputRightAddon children="@zt.eth" />
          </InputGroup>
        </FormControl>
        <Button isLoading={isLoading} onClick={handleClaimUsername}>
          Claim Username
        </Button>
      </Flex>
      <Alert status='warning'>
        <AlertIcon />
        Your account is currently not deployed.
      </Alert>
      <Alert status='warning'>
        <AlertIcon />
        Your account details are currently managed locally. Don't clear your browser storage without claiming your
        username or else you will lose access to account.
      </Alert>
    </Flex>
  );
};

export default Dashboard;