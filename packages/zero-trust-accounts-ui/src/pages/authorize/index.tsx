import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Checkbox,
  Container,
  Flex,
  FormControl,
  Heading,
  Select,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { LocalPasskeyMetaInfoMap } from "../signup";
import { useLocalStorage } from "usehooks-ts";
import { formatAddress } from "../../utils";
import { useSearchParams } from "react-router-dom";
import { Passkey, ZeroTrustAccount, ZeroTrustSession } from "zero-trust-core-sdk";
import { ethers } from "ethers";
import { useZeroTrustConfig } from "../../hooks/useZeroTrustConfig";
import { useEthereum } from "../../hooks/useEthereum";
import { ISessionAccount } from "zero-trust-core-sdk/dist/src/types/ZeroTrustAccount";
import { logger } from "../../lib/logger";

type ApplicationScope = {
  [contract:string] : {
    name:string,
    selector:string
  }[]
}

export default function Authorize() {
  let [searchParams] = useSearchParams();
  let [isLoading,setIsLoading] = useState(false)
  const [sessionTimeInterval,setSessionTimeInterval] = useState(5)
  const [selectedScopes, setSelectedScopes] = useState<{ [contract: string]: string[] }>({});
  let origin = searchParams.get('origin')
  let user = searchParams.get('user')
  let clientId = searchParams.get('client_id')
  let [scopes,setScopes]= useState<ApplicationScope>()
  const {ethereumProvider,bundlerProvider,paymasterProvider} = useEthereum() 
  const {accountFactoryAddress,entryPointAddress} = useZeroTrustConfig();


  const [localPasskeyMetaInfoMap,]= useLocalStorage<LocalPasskeyMetaInfoMap>("localPasskeyMetaInfoMap",{})

  // const handleAuthorizeSignIn = () =>{
    
  // }

  const requestScope = () =>{
    setIsLoading(true)
    const message = {request:'get_scope'}
    window.opener.postMessage(message, origin);
  }


  useEffect(() => {
    // Handle the message event to receive data from the window opener
    const receiveMessage = (event) => {
      // Ensure that the message is from a trusted origin
      if (event.origin === origin) {
        const data = event.data

        if(data && data.request === 'get_scope' && data.response ){
          // save the scope in component state
          setScopes(data.response)
          setIsLoading(false)
        }
      }
    };
    if(searchParams.has('user') &&  searchParams.has('client_id') && searchParams.has('origin') ){
       // Add event listener for the message event
      window.addEventListener('message', receiveMessage);
      requestScope()
    }
    // Clean up the event listener when the component is unmounted
    return () => {
      window.removeEventListener('message', receiveMessage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);


  const onAllow = async () =>{
    setIsLoading(true)
    // Check if any scope is selected
    const isScopeSelected = Object.keys(selectedScopes).length > 0 && Object.keys(selectedScopes).some((contract) => selectedScopes[contract].length > 0);
    let message
    if (isScopeSelected) {
      // Scope is selected, 
      // need to generate session commitment
      // to generate session commitment use the ZeroTrustSession passing the scope
      const zeroTrustSession  = new ZeroTrustSession(selectedScopes)
      // Get the passkey details for the local user who is claiming the username
      const publicKey = Passkey.hex2buf(localPasskeyMetaInfoMap[user].publicKeyAsHex);
      const publicKeyAsCryptoKey = await Passkey.importPublicKeyAsCryptoKey( publicKey );
      const [pubKeyX,pubKeyY] = await Passkey.getPublicKeyXYCoordinate(publicKeyAsCryptoKey)
      const credentialId = ethers.toUtf8Bytes(localPasskeyMetaInfoMap[user].credentialId)
      
      //use zerotrust account to execute the claimUsernameCalldata
      const passkeyMetaInfo= {
        pubKeyX,
        pubKeyY,
        salt:0,
        credentialId
      }
      logger.debug(passkeyMetaInfo)
      const sessionStartTimeDate = new Date(Date.now());
      const sessionEndTimeDate = (new Date( Date.now() + sessionTimeInterval*60*1000))
      const sessionStartTime = Math.round(sessionStartTimeDate.getTime()/1000)
      const sessionExpiry = Math.round(sessionEndTimeDate.getTime()/1000)
      const zerotrustAccount = new ZeroTrustAccount(ethereumProvider,entryPointAddress,accountFactoryAddress,passkeyMetaInfo)
      const session :ISessionAccount.SessionStruct= {
          allowedContracts:Object.keys(selectedScopes).length,
          allowedInactiveDuration:0,
          extendWithInactiveDuration:false,
          sessionCommitment:zeroTrustSession.commitment.toString(),
          validAfter:sessionStartTime,
          validUntil:sessionExpiry
      }
      logger.debug(session)
      const {response,error} = await zerotrustAccount.createSession(clientId,session,bundlerProvider,paymasterProvider);
      console.log(response)
      console.log(error)
      console.log(`https://goerli.basescan.org/tx/${response.receipt.transactionHash}`)
      if(error || !response.success){
          message = {
            status:401,
            request:'authorize',
            response:{
              message:"Failed authorization request"
            }
          }
      }else{
          message = {
            status:200,
            request:'authorize',
            response:{
              message:"User Successfully authorized the request",
              userAccountAddress:await zerotrustAccount.getCounterfactualAccountAddress(),
              sessionIdentity:zeroTrustSession.toIdentityString(),
              authorizedScope: selectedScopes,
              session:session
            }
          }
          
      }

    }
    setIsLoading(false)
    window.opener.postMessage(message, origin);
  }
  const onDeny = () => {
    const denyMessage = {
      status:403,
      message:"User denied authorization request"
    }
    window.opener.postMessage(denyMessage, origin);
  }

  if(!searchParams.has('user') &&  !searchParams.has('client_id') && !searchParams.has('origin') )
  return <Text>Invalid Request.</Text>
  
  if(isLoading){
    return  <Container maxW={'6xl'}>
              <Flex direction={"column"} minH={"100vh"} justify='center' align={'center'} p={2}  >
                <Spinner
                    thickness='4px'
                    speed='0.65s'
                    emptyColor='gray.200'
                    color='white'
                    size='xl'
                  />
              </Flex>
            </Container>
  }

  return (
    <Container maxW={'6xl'}>
     <Flex direction={"column"} minH={"100vh"} p={2}  >
        <Container maxW={'3xl'}>
          <Box maxW="400px" mx="auto" mt="8">
            <Heading mb="4">Authorization Request</Heading>
            <Text mb="4">{`The application ${clientId} is requesting access to ${user} account for the following scopes:`}</Text>
            {scopes && <RenderScopes scopes={scopes} selectedScopes={selectedScopes} setSelectedScopes={setSelectedScopes} />}
            
            <FormControl my="4">
              <Flex align="center" alignContent={'center'}  >
                <Box as="span" flex="1" fontSize="small" px={3}>
                  Session Validity
                </Box>
                <Select
                  flex="1" 
                  size="small"
                  variant="flushed"
                  placeholder="select session validity"
                  value={sessionTimeInterval}
                  onChange={(e) => setSessionTimeInterval(parseInt(e.target.value, 10))}
                >
                  <option value={30}>30 Min</option>
                  <option value={15}>15 Min</option>
                  <option value={5}>5 Min</option>
                </Select>
              </Flex>
            </FormControl>
            <Button isLoading={isLoading}
             isDisabled={Object.keys(selectedScopes).length === 0} // Disable button if no scope is selected // Disable button if no scope is selected
             colorScheme="green" mr="4" onClick={onAllow}>
              Authorize
            </Button>
            <Button disabled={isLoading} colorScheme="red" onClick={onDeny}>
              Deny
            </Button>
          </Box>

          <Stack as={Box} textAlign={'center'}
            spacing={{ base: 8, md: 14 }} >
          </Stack>
        </Container>
      </Flex>
    </Container>
  );
}

const RenderScopes = ({
  scopes,
  selectedScopes,
  setSelectedScopes,
}: {
  scopes: ApplicationScope;
  selectedScopes: { [contract: string]: string[] };
  setSelectedScopes: React.Dispatch<React.SetStateAction<{ [contract: string]: string[] }>>;
})=> {
 
  const handleCheckboxChange = (contract: string, selector: string) => {
    setSelectedScopes((prevState) => {
      const updatedScopes = { ...prevState };
  
      if (updatedScopes[contract]) {
        // If contract already exists, check if selector is selected or not
        if (updatedScopes[contract].includes(selector)) {
          // If selector is already selected, remove it
          updatedScopes[contract] = updatedScopes[contract].filter((s) => s !== selector);
          
          // Remove the contract key if no scope is selected for that contract
          if (updatedScopes[contract].length === 0) {
            delete updatedScopes[contract];
          }
        } else {
          // If selector is not selected, add it
          updatedScopes[contract].push(selector);
        }
      } else {
        // If contract doesn't exist, add it and add the selector
        updatedScopes[contract] = [selector];
      }
  
      return updatedScopes;
    });
  };
  

  return (
    <Stack direction="column">
      {Object.entries(scopes).map(([contract, scopeList]) => (
        <Accordion key={contract} allowToggle>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Stack direction={"row"} align={"center"} w={"100%"}>
                  <Box as="span" fontSize={"small"} flex="1" textAlign="left">
                    {formatAddress(contract)}
                  </Box>
                  <Text fontSize={"small"} align={'center'}>scopes: {`${selectedScopes[contract]?selectedScopes[contract].length:0}/${scopeList.length}`}</Text>
                  <AccordionIcon />
                </Stack>
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {scopeList.map((scope) => (
                <Flex key={scope.selector}>
                  <Checkbox
                    value={scope.selector}
                    isChecked={
                      selectedScopes[contract] ? selectedScopes[contract].includes(scope.selector) : false
                    }
                    onChange={() => handleCheckboxChange(contract, scope.selector)}
                  >
                    {scope.name}
                  </Checkbox>
                </Flex>
              ))}
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      ))}
    </Stack>
  );
};