import { CloseIcon } from "@chakra-ui/icons";
import { Box, Button, Grid, HStack, Icon, Link, Text, VStack } from "@chakra-ui/react";
import { FaGithub, FaRegFile } from "react-icons/fa";

const StepCard = ({ title, description }) => (
  <Box p={1} borderWidth="1px" borderRadius="md" borderColor={'black'}>
    <Text fontSize={'sm'} fontWeight="bold" mb={2}>{title}</Text>
    <Text fontSize={'sm'}>{description}</Text>
  </Box>
);

const MoreInfoDrawer = ({isMoreInfoDrawerOpen,onMoreInfoDrawerClose}) => {
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
    maxHeight="90vh"
    overflowY="auto"
    style={isMoreInfoDrawerOpen ? { transition: "height 0.6s ease-in-out, opacity 0.6s ease-in-out", opacity: 1, height: "auto" } : {}}
  >
    <Box
    position="absolute"
    zIndex={10}
    top={3}
    right={4}
  >
    <Button
      size="sm"
      onClick={onMoreInfoDrawerClose}
      bg="transparent"
      _hover={{ bg: "transparent" }}
    >
      <Icon as={CloseIcon} boxSize={4} />
    </Button>
  </Box>
  <VStack>
    <Text  textColor={'black'} fontWeight={'bold'}>Demo Flow</Text>
    <Grid
      templateColumns="repeat(auto-fill, minmax(300px, 1fr))"
      gap={2}
      p={1}
      
      textColor={'black'}
    >
      <StepCard
        title="Step 1: Create ZeroTrust Account"
        description="User interacts with dapp website, clicks 'Connect Wallet' or 'Sign In.' Existing users sign in, new users create an account. User grants dapp access to ZeroTrust account for NFT minting."
      />
      <StepCard
        title="Step 2: Authorize Dapp"
        description="User authorizes the dapp for that session and specifies the allowed scope. Signing the user operation records session details on the blockchain."
      />
      <StepCard
        title="Step 3: Mint NFT"
        description="User goes to the dapp and uses the authorized ZeroTrust account. They click 'mint' and successfully create the NFT."
      />
      <StepCard
        title="Under the Hood"
        description="We tie the user's selected account name to a passkey, securely store it in the browser, and derive a counterfactual smart contract address from this metadata. A sessionID is created to define the scope of activity. It is saved onchain by signing a transaction using the passkey. Instead of signing, the user submits a proof for operations, all on their device."
      />
    </Grid>
    <HStack textColor={'black'}>
     <Icon as={FaRegFile}/>
      <Link  
      href={'https://smartproducts.pimlico.io/initiatives'} 
      target="_blank">
        ZeroTrust Docs
      </Link>
    </HStack>
    <HStack textColor={'black'}>
     <Icon as={FaGithub}/>
      <Link  
      href={'https://github.com/KannuSingh/zero-trust'} 
      target="_blank">
        Github
      </Link>
    </HStack>
    
  </VStack>
    
  </Box>)
}
 
export default MoreInfoDrawer