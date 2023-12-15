import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useSessionStorage } from "usehooks-ts";
import { ZeroTrustAccountSessionContext } from "./useZeroTrustAccountSession";


export type ZeroTrustAccountSession = {
	allowedContracts: number;
	allowedInactiveDuration?: number;
	extendWithInactiveDuration?: false;
	sessionCommitment: string;
	validAfter: number;
	validUntil: number;
};

export type SignInWithZeroTrustAccountContextProps = {
	success: string|null;
	error: string|null;
  isLoading:boolean;
  disconnect: () => void;
  handleSignIn:  () => void;
};
const SignInWithZeroTrustAccountContext = createContext<SignInWithZeroTrustAccountContextProps>({
	success: null,
	error: null,
	isLoading: false,
	disconnect: () => {},
	handleSignIn: () => {},
});

export type OnSuccessCallback = (message: string) => void;
export type OnErrorCallback = (message: string) => void;

export const useSignInWithZeroTrustAccount = (onSuccess?: OnSuccessCallback, onError?: OnErrorCallback) => {
	const context = useContext(SignInWithZeroTrustAccountContext);
	if (!context) {
		throw new Error(
			"useSignInWithZeroTrustAccount must be used within a SignInWithZeroTrustAccountProvider",
		);
	}

  const { success, error } = context;
  const onSuccessRef = useRef<OnSuccessCallback | undefined>();
  const onErrorRef = useRef<OnErrorCallback | undefined>();

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (success && onSuccessRef.current) {
      onSuccessRef.current(success);
    }
  }, [success]);

  useEffect(() => {
    if (error && onErrorRef.current) {
      onErrorRef.current(error);
    }
  }, [error]);
	return context;
};

export const SignInWithZeroTrustAccountProvider = ({
	zeroTrustClientURL,
	dappId,
	dappScopes,
	children,
}: {
	zeroTrustClientURL: string;
	dappId: string;
	dappScopes: {
		[contract: string]: {
			name: string;
			selector: string;
		}[];
	};
	children: React.ReactNode;
}) => {
	const [isLoading,setLoading] = useState(false)
	const [error,setError] = useState<string|null>(null)
	const [success,setSuccess] = useState<string|null>(null)
  const [popupWindow, setPopupWindow] = useState<Window|null>();
  const [session, setSession] = useSessionStorage<ZeroTrustAccountSession | null>("loggedInSession", null);
	const [identity, setIdentity] = useSessionStorage<string | null>("identity", null);
	const [userAddress, setUserAddress] = useSessionStorage<string | null>( "userAddress", null, );
	const [username, setUsername] = useState<string|null>(null);
	const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
	const [authorizedScopes, setAuthorizedScopes] = useSessionStorage<{ [contract: string]: string[]; } | null>("authorizedScopes", null);
  
  const onSessionExpired = useCallback(() => {
    setSession(null);
    setIdentity(null);
    setUsername(null);
  }, [setIdentity, setSession,setUsername]);

  // check if popupWindow is closed
  useEffect(() => {
    const checkWindowClosed = setInterval(() => {
      if (popupWindow && popupWindow.closed) {
        setLoading(false);
        clearInterval(checkWindowClosed);
      }
    }, 1000);

    return () => {
      clearInterval(checkWindowClosed);
    };
  }, [popupWindow]);

  // calculate remainingTime for session
  useEffect(() => {
    const calculatedTimeRemaining = session && calculateTimeRemaining(session);
    setTimeRemaining(calculatedTimeRemaining);

    if (calculatedTimeRemaining !== null && calculatedTimeRemaining > 0) {
      const countdown = setInterval(() => {
        setTimeRemaining((prevTime) => (prevTime !== null ? prevTime - 1 : null));
      }, 1000);

      return () => clearInterval(countdown);
    } else {
      onSessionExpired();
    }
  }, [timeRemaining, onSessionExpired, session]);


  useEffect(() => {
    const receiveMessage = (event:MessageEvent) => {
      console.log( `Event Origin: ${event.origin}`)
      console.log(zeroTrustClientURL)
      if (event.origin === zeroTrustClientURL) {
        console.log("Received Data from popup", event.data);
        const data = event.data;
        if (data && data.request === 'authorize') {
          if (data.status === 200) {
            const { message, userAccountAddress, sessionIdentity, authorizedScope, session } = data.response;
            setUserAddress(userAccountAddress);
            setIdentity(sessionIdentity);
            setAuthorizedScopes(authorizedScope);
            setSession(session);
            setLoading(false)
            setSuccess(message)
          } else if (data.status === 401) {
            const { message } = data.response;
            setError(message)
          }
          if (popupWindow) {
            popupWindow.close();
          }
        } else if (data && data.request === 'get_scope') {
          const responseMessage = { request: data.request, response: dappScopes };
          if (popupWindow) {
            popupWindow.postMessage(responseMessage, zeroTrustClientURL);
          }
        } else {
          setError("Failed to Log In")
        }
      }
    };
  
    const addEventListener = () => {
      window.addEventListener('message', receiveMessage);
    };
  
    const removeEventListener = () => {
      window.removeEventListener('message', receiveMessage);
    };
  
    addEventListener();
  
    return removeEventListener;
  }, [zeroTrustClientURL, popupWindow, setIdentity, setAuthorizedScopes, setUserAddress, setSession, dappScopes]);
  

  // open popupWindow for signIn
  const handleSignIn = async () => {
    setLoading(true)
    const width = 375;
    const height = 500;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;
    const redirect_uri = window.location.origin;
    const client_id = dappId; 
    // onModalOpen()
    const popupWindow = window.open(
      `${zeroTrustClientURL}/#/authorize?client_id=${client_id}&origin=${redirect_uri}`,
      'Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    setPopupWindow(popupWindow);
  };

  // disconnect session removes session obj from sessionStorage
  const disconnect = () =>{
    setSession(null);
  }

	const value = {
		success,
    error,
    isLoading,
    disconnect,
		handleSignIn,
	};

	return (
				<SignInWithZeroTrustAccountContext.Provider value={value}>
          <ZeroTrustAccountSessionContext.Provider value={{ 
            userAddress,
            username,
            identity,
            session,
            timeRemaining,
            authorizedScopes,
          }}>
					  {children}
          </ZeroTrustAccountSessionContext.Provider>
				</SignInWithZeroTrustAccountContext.Provider>
	);
};



const calculateTimeRemaining = (session:ZeroTrustAccountSession) => {
  if (session && session.validUntil && session.validAfter) {
    const currentTime = Math.floor(Date.now() / 1000);
    const validAfterInSeconds = Math.floor(session.validAfter);
    const validUntilInSeconds = Math.floor(session.validUntil );
    const remainingTime = validUntilInSeconds - Math.max(currentTime, validAfterInSeconds);
    return remainingTime > 0 ? remainingTime : null;
  }
  return null;
};