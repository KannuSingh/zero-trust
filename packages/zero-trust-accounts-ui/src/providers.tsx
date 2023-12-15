import { ChakraProvider, extendTheme } from '@chakra-ui/react'
import { SessionProvider } from './hooks/useSession'
import React from 'react'
import { EthereumProvider } from './hooks/useEthereum'
import { ZeroTrustConfigProvider } from './hooks/useZeroTrustConfig'

const config = {
  initialColorMode: "light", // Set the initial color mode to light mode
  useSystemColorMode: false, // Disable system color mode
};
const theme = extendTheme({
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === "dark" ? "black" : "white", // Customize dark mode background color
        color: props.colorMode === "dark" ? "white" : "black", // Customize dark mode text color
      },
    }),
  },
});
export default function Providers({ 
    children 
  }: { 
  children: React.ReactNode 
  }) {
    
  return (
      <ChakraProvider theme={theme}>
        <ZeroTrustConfigProvider>
          <EthereumProvider>
            <SessionProvider>
              {children}
            </SessionProvider>
          </EthereumProvider>
        </ZeroTrustConfigProvider>
      </ChakraProvider>
  )
}