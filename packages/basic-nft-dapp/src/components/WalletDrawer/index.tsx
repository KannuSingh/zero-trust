import { useSignInWithZeroTrustAccount } from "../../hooks";
import { CloseIcon } from "@chakra-ui/icons";
import { Box, Button, Flex, Icon, Spinner, Text, VStack, useToast } from "@chakra-ui/react";

const WalletDrawer = ({isWalletDrawerOpen, onWalletDrawerClose}) =>{
  const toast = useToast()
  const onSuccessfullSignInCallback = (message:string) =>{
    toast({
      title: message,
      description: '',
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  }
  const onErrorSignInCallback = (message:string) =>{
    toast({
      title: message,
      description: '',
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }
  const { isLoading,  handleSignIn  } = useSignInWithZeroTrustAccount(onSuccessfullSignInCallback,onErrorSignInCallback)
  
  return (<Box
    position="absolute"
    bottom={0}
    left={0}
    right={0}
    zIndex={10}
    bg="white"
    boxShadow="lg"
    p={4}
    mx={1}
    bgColor={'red.300'}
    roundedTop={'10%'}
    maxHeight="50vh"
    overflowY="auto"
    style={isWalletDrawerOpen ? { transition: "height 0.6s ease-in-out, opacity 0.6s ease-in-out", opacity: 1, height: "50vh" } : {}}
  >
    <Box
    position="absolute"
    zIndex={10}
    top={3}
    right={4}
  >
    <Button
      size="sm"
      onClick={onWalletDrawerClose}
      bg="transparent"
      _hover={{ bg: "transparent" }}
    >
      <Icon as={CloseIcon} boxSize={4} />
    </Button>
  </Box>
    {isLoading ?
      <Flex w={'full'} h={'full'} justify={'center'} align={'center'}>
          <Spinner size='xl' />
      </Flex>
      :<VStack w={'full'}>
        <Text textColor={'black'} mb={4}>Log In or Sign Up</Text>
        <Button isDisabled={true} mb={4} w={'full'}  _hover={{  bg: 'black', }}  bgColor="black"  textColor={'white'}  >Connect MetaMask</Button>

        <Button isDisabled={true} mb={4} w={'full'} bgColor="black"  _hover={{  bg: 'black', }} textColor={'white'}  >Continue with email</Button>

        <Button mb={4} w={'full'}
          _hover={{  bg: 'black', }} 
          bgColor="gray.800" textColor={'white'} 
          onClick={handleSignIn}
          isLoading={isLoading}
          >SignIn w/ Zero Trust Accounts
        </Button>
      </VStack>
    }
  </Box>);
}

export default WalletDrawer