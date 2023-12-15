import {
  Box,
  Button,
  Container,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputGroup,
  Stack,
  Text,
  useToast,
} from "@chakra-ui/react";
import React, { useState } from "react";
import Header from "../../components/Header";
import { useNavigate, useSearchParams } from "react-router-dom";
import { LocalPasskeyMetaInfoMap } from "../signup";
import { useLocalStorage } from "usehooks-ts";
import { Passkey, Verification } from "zero-trust-core-sdk";
import { logger } from "../../lib/logger";

export default function Login() {
  let [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast()
  const [nameOrUsername , setNameOrUsername ] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState('');
  const [localPasskeyMetaInfoMap,]= useLocalStorage<LocalPasskeyMetaInfoMap>("localPasskeyMetaInfoMap",{})
  const [isLoading,setIsLoading] = useState(false)
  
  const handleLogin = async (e) => {
    try{
      setIsLoading(true)
      e.preventDefault();
      setErrorMessage('');
      // Sanitize the input for security purposes
      const sanitizedInput = sanitizeInput(nameOrUsername);
      if (sanitizedInput.trim() === '') {
        setErrorMessage('Please enter your name or username.');
      } else {
        let dataSource;
        let verificationData:Verification;
        if (sanitizedInput.endsWith('@zt.eth')) {
          dataSource= 'onchain'
          // consider inputValue as a username and get details from onchain 


        } else {
          dataSource= 'local'
          // consider inputValue as a name and get details from local storage 
          if(localPasskeyMetaInfoMap[sanitizedInput]){
            const userCredentials: PublicKeyCredentialDescriptor = {
              id: Passkey.parseBase64url(localPasskeyMetaInfoMap[sanitizedInput].credentialId),
              type: 'public-key'
            };
            const publicKeyAsHexString = localPasskeyMetaInfoMap[sanitizedInput].publicKeyAsHex
            verificationData = await verifyCredentials(publicKeyAsHexString,userCredentials)
            logger.info("(🪪,✅) Verification", verificationData);
          }
        }
        console.log('search param in login page',searchParams.get('redirect_url'))
        console.log(searchParams)
        if(searchParams.has('redirect_url') && verificationData.isValid){
          navigate(`${searchParams.get('redirect_url')}&user=${sanitizedInput}`)
        }else if(verificationData.isValid){
          navigate(`/${dataSource}/${sanitizedInput}/dashboard`)
        }
      }
    }catch(error){
      logger.error(error)
    }
    setIsLoading(false)
  };
  const sanitizeInput = (input:string) => {
    // Removing leading and trailing spaces
    let sanitizedInput = input.trim();
    // Allow alphanumeric characters, underscores
    sanitizedInput = sanitizedInput.replace(/[^a-zA-Z0-9_@]/g, '');
    return sanitizedInput;
  };

  const verifyCredentials = async (publicKeyAsHexString:string,userCredentials:PublicKeyCredentialDescriptor) => {
    const { data: assertion, response, error } = await Passkey.get({allowCredentials:[userCredentials]});
    if (error) {
      logger.error("(🪪,❌) Error", error);
      toast({
        title: "Error retrieving assertion.",
        description: error,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    if (assertion) {
      logger.info("(🪪,✅) Assertion", assertion);
      
      const assertation = response as AuthenticatorAssertionResponse;
      const publicKey = Passkey.hex2buf(publicKeyAsHexString);
      const verificationData = await Passkey.verifySignature({
        publicKey,
        assertation,
      });
      toast({
        title: verificationData.isValid ?"Authentication Passed.":"Authentication Failed",
        status: verificationData.isValid ? "success":"error",
        duration: 3000,
        isClosable: true,
      });
      return verificationData;
    }
  };

  const handleSignUp = () =>{
    if(searchParams.has('redirect_url')){
      navigate(`/signup?redirect_url=${encodeURIComponent(searchParams.get('redirect_url'))}`)
    }else{
      navigate('/signup')
    }
  }

  return (
    <Container maxW={'6xl'}>
    <Flex flexDirection="column" minHeight="100vh">
      {/* Navbar */}
      <Header/>
      {/* Body */}
      <Flex flex={1} flexDirection="column">
        <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
          <Stack spacing="8">
            <Stack spacing="4" align={'center'}>
              {/* <Box >
                  <Image
                    src={useColorModeValue("/zt-logo-black-text.png", "/zt-logo-white-text.png")}
                    alt="ZeroTrustLogo"
                    height={150}
                  />
                </Box> */}
              <Stack spacing={{ base: '2', md: '3' }} textAlign="center">
                <Heading size={{ base: 'xs', md: 'sm' }}>Log in to your account</Heading>
              </Stack>
            </Stack>
            <Box
              py={{ base: '0', sm: '8' }}
              px={{ base: '4', sm: '10' }}
              bg={{ base: 'transparent', sm: 'bg.surface' }}
              boxShadow={{ base: 'none', sm: 'md' }}
              borderRadius={{ base: 'none', sm: 'xl' }}
            >
              <Stack spacing="6">
                <Stack spacing="5">
                  
                  <FormControl>
                    <FormLabel htmlFor="nameOrUsername">Name or Username</FormLabel>
                    <InputGroup>
                      <Input id="nameOrUsername" value={nameOrUsername}
                      onChange={(e) => setNameOrUsername(e.target.value.replace(/[^a-zA-Z0-9_@]/g, ''))} type="text" />
                    </InputGroup>
                  </FormControl>
                </Stack>
                <Stack spacing="6">
                  <Button isLoading={isLoading} onClick={handleLogin}>Sign in</Button>
                  <Text color="fg.muted">
                    Don't have an account? <Button variant='link' onClick={handleSignUp}>Sign up</Button>
                  </Text>
                </Stack>
              </Stack>
            </Box>
          </Stack>
        </Container>
      </Flex>
    </Flex>
    </Container>
  );
}