import  { createContext, useContext, } from "react";
import { ZeroTrustAccountSession } from "./useSignInWithZeroTrustAccount";

export type ZeroTrustAccountSessionContextProps = {
	userAddress: string | null;
	username: string | null;
	identity: string | null;
	session: ZeroTrustAccountSession | null;
	timeRemaining: number | null;
	authorizedScopes: { [contract: string]: string[] } | null;
};
export const ZeroTrustAccountSessionContext =
	createContext<ZeroTrustAccountSessionContextProps>({
		userAddress: null,
		username: null,
		identity: null,
		session: null,
		timeRemaining: null,
		authorizedScopes: null,
	});

export const useZeroTrustAccountSession = () => {
	const context = useContext(ZeroTrustAccountSessionContext);
	if (!context) {
		throw new Error(
			"useZeroTrustAccountSession must be used within a SignInWithZeroTrustAccountContext",
		);
	}
	return context;
};