import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useLocalStorage } from "usehooks-ts";


export interface Session {
  sessionCommitment: string;
  validUntil: number;
  validAfter: number;
}

const SessionContext = createContext({
  userAddress:null,
  username:null,
  identity:null,
  session: null,
  timeRemaining: null,
  setSession: (newSession) => {}, 
  setIdentity: (newIdentity) => {},
  setUserAddress:(address) =>{},
  setUsername:(username) =>{}
});

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
};

const calculateTimeRemaining = (session:Session) => {
  if (session && session.validUntil && session.validAfter) {
    const currentTime = Math.floor(Date.now() / 1000);
    const validAfterInSeconds = Math.floor(session.validAfter);
    const validUntilInSeconds = Math.floor(session.validUntil );
    const remainingTime = validUntilInSeconds - Math.max(currentTime, validAfterInSeconds);
    return remainingTime > 0 ? remainingTime : null;
  }
  return null;
};

export const SessionProvider = ({ children }) => {
  const [session, setSession] = useLocalStorage<Session>("loggedInSession", null);
  const [identity,setIdentity] = useLocalStorage<string>("identity", null);
  const [userAddress,setUserAddress] = useState(null)
  const [username,setUsername] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining(session));

  const onSessionExpired = useCallback(() => {
    setSession(null);
    setIdentity(null);
    setUsername(null);
  }, [setIdentity, setSession,setUsername]);

  
  useEffect(() => {
    const calculatedTimeRemaining = calculateTimeRemaining(session);
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

  const value = {
    userAddress,
    setUserAddress,
    identity,
    setIdentity,
    session,
    setSession,
    timeRemaining,
    username,
    setUsername
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};
