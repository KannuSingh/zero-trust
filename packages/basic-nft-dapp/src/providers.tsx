import { ChakraProvider, ColorModeScript, extendTheme } from '@chakra-ui/react'
import { exampleMintDappScope } from './config';
import {  SignInWithZeroTrustAccountProvider } from './hooks';

const theme = extendTheme({
  config: {
    initialColorMode: "dark",
    useSystemColorMode: false,
  },
  styles: {
    global: () => ({
      body: {
        bg: "black",
        color: "white",
      },
    }),
  },
});

export default function Providers({ 
    children 
  }: { 
  children: React.ReactNode 
  }) {

  const zeroTrustClientURL = process.env.REACT_APP_ZERO_TRUST_CLIENT_URL
  const dappId = process.env.REACT_APP_DAPP_ID
  return (
      <ChakraProvider theme={theme}>
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <SignInWithZeroTrustAccountProvider zeroTrustClientURL={zeroTrustClientURL} dappId={dappId} dappScopes={exampleMintDappScope} >
          {children}
        </SignInWithZeroTrustAccountProvider>
      </ChakraProvider>
  )
}