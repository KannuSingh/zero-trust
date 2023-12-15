import { ChakraProvider } from '@chakra-ui/react'
import { exampleMintDappScope } from './config';
import {  SignInWithZeroTrustAccountProvider } from './hooks';

export default function Providers({ 
    children 
  }: { 
  children: React.ReactNode 
  }) {

  const zeroTrustClientURL = 'http://localhost:3002'
  const dappId = 'demoNFTMinter'
  return (
      <ChakraProvider>
        <SignInWithZeroTrustAccountProvider zeroTrustClientURL={zeroTrustClientURL} dappId={dappId} dappScopes={exampleMintDappScope} >
          {/* <SessionProvider zeroTrustClientURL={zeroTrustClientURL} dappId={dappId} dappScopes={exampleMintDappScope}> */}
            {children}
          {/* </SessionProvider> */}
        </SignInWithZeroTrustAccountProvider>
      </ChakraProvider>
  )
}