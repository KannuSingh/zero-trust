import { logger } from "../logger";
import { PASSKEY_ERRORS } from "./constants/errors";

export type PasskeyCredentialResponse = {
	data: PublicKeyCredential | null;
	response:
		| AuthenticatorAttestationResponse
		| AuthenticatorAssertionResponse
		| null;
	error: string | null;
};

interface PasskeyStringResponse {
	data: string | null;
	error: string | null;
}

export type PasskeyRawIdResponse = PasskeyStringResponse;
export type PasskeyPublicKeyAsHexResponse = PasskeyStringResponse;

export type Verification = {
	isValid: boolean;
	signature: Uint8Array;
	data: Uint8Array;
};

export type WebauthnChallenge = {
	type: string; //usually 'webauthn.get'
	challenge: string;
	origin: string; //usually the origin of the webauthn request
};

export const truncate = (word: string) =>
	word && `...${word.substr(word.length - 10, word.length)}`;

export class Passkey {
	// @TODO: Decide whether we want runtime public key credential management or keep static in all methods
	static _createdCredential: PublicKeyCredential;

	static getPublicKeyFromAttestationResponse({
		response,
	}: { response: AuthenticatorAttestationResponse }) {
		if (!response) {
			return { data: null, error: PASSKEY_ERRORS.INVALID_CREDENTIAL_RESPONSE };
		}
		try {
			const publicKey = response.getPublicKey();
			const publicKeyAsHex = Passkey.buf2hex(publicKey!);
			logger.debug("(🪪,ℹ️) Public Key as Hex", publicKeyAsHex);
			return { data: publicKey, error: null };
		} catch (e) {
			logger.error(PASSKEY_ERRORS.CREDENTIAL_RESPONSE_HAS_NO_PUBLIC_KEY, e);
			return {
				data: null,
				error: PASSKEY_ERRORS.CREDENTIAL_RESPONSE_HAS_NO_PUBLIC_KEY,
			};
		}
	}

	static async get({ allowCredentials = [] }: { allowCredentials?: PublicKeyCredentialDescriptor[] }): Promise<PasskeyCredentialResponse> {
    logger.debug('(🪪,ℹ️) Obtaining credentials');
    const randomUUID = crypto.randomUUID()
    const challenge = this.hex2buf(randomUUID)
    logger.debug('(🪄,ℹ️) Challenge', challenge);
    logger.debug('(🪄,ℹ️) Challenge (base64)', this.toBase64url(challenge));
    logger.debug('(🪄,ℹ️) Challenge (hex)', this.buf2hex(challenge));
    try {
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        timeout: 60000,
        allowCredentials,
      };

      const assertion = (await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      })) as PublicKeyCredential;

      return { data: assertion, response: assertion.response as AuthenticatorAssertionResponse, error: null }

    } catch (e) {
      logger.error(PASSKEY_ERRORS.UNABLE_TO_RETRIEVE_CREDENTIAL, e);
      return { data: null, response: null, error: PASSKEY_ERRORS.UNABLE_TO_RETRIEVE_CREDENTIAL };
    }
  }

	static async create({
		appName,
		name,
		displayName,
		yubikeyOnly,
	}: {
		appName: string;
		name: string;
		displayName: string;
		yubikeyOnly?: boolean;
	}): Promise<PasskeyCredentialResponse> {
		logger.debug(`(🪪,ℹ️) Creating credential for ${name}`);
		try {
			if (!navigator.credentials) {
				return {
					data: null,
					response: null,
					error: PASSKEY_ERRORS.BROWSER_DOES_NOT_SUPPORT_PASSKEY,
				};
			}

			const credential = (await navigator.credentials.create({
				publicKey: Passkey.publicKeyCredentialCreationOptions(
					appName,
					name,
					displayName,
					yubikeyOnly,
				),
			})) as PublicKeyCredential;

			Passkey._createdCredential = credential;
			return {
				data: credential,
				response: credential.response as AuthenticatorAttestationResponse,
				error: null,
			};
		} catch (e) {
			logger.error(PASSKEY_ERRORS.USER_REJECTED_CREDENTIAL, e);
			return {
				data: null,
				response: null,
				error: PASSKEY_ERRORS.USER_REJECTED_CREDENTIAL,
			};
		}
	}
	// NB: Passkey is the easiest way to parse the DER format from the getPublicKey method given the webauthn
	// navigator.credentials.create({ ... }).response object. Do not try to mess with CBOR against Passkey
	// ArrayBuffer directly, as it does not have enough data to be parsed properly via CBOR.
	static importPublicKeyAsCryptoKey = async (
		publicKey: ArrayBuffer,
	): Promise<CryptoKey | null> => {
		logger.debug(
			"(🔑,ℹ️) Parsing webauthn response public key as CryptoKey via Web Crypto API",
		);
		try {
			const key = await crypto.subtle.importKey(
				// The getPublicKey() operation thus returns the credential public key as a SubjectPublicKeyInfo. See:
				// https://w3c.github.io/webauthn/#sctn-public-key-easy
				// crypto.subtle can import the spki format:
				// https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/importKey
				"spki", // "spki" Simple Public Key Infrastructure rfc2692
				publicKey,
				{
					// these are the algorithm options
					// await cred.response.getPublicKeyAlgorithm() // returns -7
					// -7 is ES256 with P-256 // search -7 in https://w3c.github.io/webauthn
					// the W3C webcrypto docs:
					// https://www.w3.org/TR/WebCryptoAPI/#informative-references (scroll down a bit)
					// ES256 corrisponds with the following AlgorithmIdentifier:
					name: "ECDSA",
					namedCurve: "P-256",
					hash: { name: "SHA-256" },
				},
				true, //whether the key is extractable (i.e. can be used in exportKey)
				["verify"], //"verify" for public key import, "sign" for private key imports
			);
			return key;
		} catch (e) {
			logger.error(PASSKEY_ERRORS.PUBLIC_KEY_CANT_BE_PARSED_AS_CRYPTO_KEY, e);
			return null;
		}
	};

	static publicKeyCredentialCreationOptions(
		appName: string,
		name: string,
		displayName: string,
		yubikeyOnly?: boolean,
	): PublicKeyCredentialCreationOptions {
		return {
			challenge: crypto.getRandomValues(new Uint8Array(16)),
			rp: {
				name: appName,
			},
			user: {
				id: crypto.getRandomValues(new Uint8Array(16)),
				name: name ? name : displayName,
				displayName: displayName,
			},
			pubKeyCredParams: [
				{
					type: "public-key",
					alg: -7,
				},
			],
			timeout: 60000,
			attestation: "direct",
			...(yubikeyOnly && {
				authenticatorSelection: {
					authenticatorAttachment: "cross-platform",
				},
			}),
		};
	}

	static async getPublicKeyXYCoordinate(
		publicKey: CryptoKey,
	): Promise<[string, string] | undefined> {
		let jwkKey;
		try {
			jwkKey = await window.crypto.subtle.exportKey("jwk", publicKey);
			logger.debug("JWK key :", jwkKey);
		} catch (err) {
			console.error("Failed to export key:", err);
			return;
		}
		if (jwkKey) {
			const pubKeyX = `0x${Passkey.buf2hex(Passkey.parseBase64url(jwkKey.x!))}`;
			const pubKeyY = `0x${Passkey.buf2hex(Passkey.parseBase64url(jwkKey.y!))}`;
			logger.debug("pubKeyX:", pubKeyX);
			logger.debug("pubKeyY:", pubKeyY);
			return [pubKeyX, pubKeyY];
		}
	}

	static async getPasskeySignatureData(
		challenge: string,
		allowCredentials?: PublicKeyCredentialDescriptor[],
	) {
		let assertion;
		try {
			logger.debug("(🪪,ℹ️) Obtaining credentials");
			const challengeBuf = Passkey.hex2buf(challenge.substring(2));
			logger.debug("(🪄,ℹ️) Challenge", challenge);
			logger.debug(
				"(🪄,ℹ️) Challenge (base64)",
				Passkey.toBase64url(challengeBuf),
			);
			logger.debug("(🪄,ℹ️) Challenge (hex)", Passkey.buf2hex(challengeBuf));

			const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions =
				{
					challenge: challengeBuf,
					timeout: 60000,
					allowCredentials,
				};

			assertion = (await navigator.credentials.get({
				publicKey: publicKeyCredentialRequestOptions,
			})) as PublicKeyCredential;
		} catch (e) {
			logger.error(PASSKEY_ERRORS.UNABLE_TO_RETRIEVE_CREDENTIAL, e);
			return {
				authenticatorData: "",
				requireUserVerification: false,
				clientDataJson: "",
				challengeLocation: 0,
				responseTypeLocation: 0,
				r: "",
				s: "",
				error: PASSKEY_ERRORS.UNABLE_TO_RETRIEVE_CREDENTIAL,
			};
		}
		if (!assertion) {
			return {
				authenticatorData: "",
				requireUserVerification: false,
				clientDataJson: "",
				challengeLocation: 0,
				responseTypeLocation: 0,
				r: "",
				s: "",
				error: PASSKEY_ERRORS.UNABLE_TO_RETRIEVE_CREDENTIAL,
			};
		}
		logger.debug("(🪪,✅) Assertion", assertion);
		logger.debug({
			title: "Assertion obtained.",
			description: "Your assertion has been retrieved.",
			status: "success",
			duration: 9000,
			isClosable: true,
		});

		const assertation = assertion.response as AuthenticatorAssertionResponse;
		// rough lengths per attr: signature = 140+/-5, authenticatorData = 74, clientData = 200+
		logger.debug("(📥,ℹ️), assertation", assertation);
		const { signature, clientDataJSON, authenticatorData } = assertation;
		

		const obtainedClientDataJSON: WebauthnChallenge = JSON.parse(
			new TextDecoder().decode(clientDataJSON),
		);

		const authenticatorDataString = `0x${Passkey.buf2hex(authenticatorData)}`;
		const clientDataJSONString = JSON.stringify(obtainedClientDataJSON);
		const challengeLocation = 23;
		const responseTypeLocation = 1;
		const requireUserVerification = false;
		const { r, s } = Passkey.normalizeSignature(signature);
		const rValue = `0x${BigInt(r).toString(16)}`;
		const sValue = `0x${BigInt(s).toString(16)}`;
		logger.debug({
			authenticatorData: authenticatorDataString,
			requireUserVerification,
			clientDataJson: clientDataJSONString,
			challengeLocation,
			responseTypeLocation,
			r: rValue,
			s: sValue,
		});
		return {
			authenticatorData: authenticatorDataString,
			requireUserVerification,
			clientDataJson: clientDataJSONString,
			challengeLocation,
			responseTypeLocation,
			r: rValue,
			s: sValue,
			error: null,
		};
	}

	static verifySignature = async ({ publicKey, assertation }: { publicKey: ArrayBuffer, assertation: AuthenticatorAssertionResponse }): Promise<Verification> => {
    // rough lengths per attr: signature = 140+/-5, authenticatorData = 74, clientData = 200+
    logger.debug('(📥,ℹ️), assertation', assertation);
    const { signature, clientDataJSON, authenticatorData } = assertation;
    logger.debug('(🖊️,ℹ️), signature', this.buf2hex(signature), this.buf2hex(signature).length);
    logger.debug('(👤,ℹ️), clientDataJSON', this.buf2hex(clientDataJSON), this.buf2hex(clientDataJSON).length);
    logger.debug('(🔑,ℹ️), authenticatorData', this.buf2hex(authenticatorData), this.buf2hex(authenticatorData).length);

    const obtainedClientDataJSON: WebauthnChallenge = JSON.parse(new TextDecoder().decode(clientDataJSON));
    logger.debug('(👤,ℹ️), clientDataJSON (parsed)', obtainedClientDataJSON);
    logger.debug('(👤,ℹ️), challenge (from clientDataJSON)', this.buf2hex(this.parseBase64url(obtainedClientDataJSON.challenge)));
    // logger.debug('(👀,ℹ️), challenge', this.buf2hex(new TextEncoder().encode(obtainedClientDataJSON.challenge)));


    const authenticatorDataAsUint8Array = new Uint8Array(authenticatorData);
    const clientDataHash = new Uint8Array(await crypto.subtle.digest("SHA-256", clientDataJSON));

    // concat authenticatorData and clientDataHash
    const signedData = new Uint8Array(authenticatorDataAsUint8Array.length + clientDataHash.length);
    signedData.set(authenticatorDataAsUint8Array);
    signedData.set(clientDataHash, authenticatorDataAsUint8Array.length);

    // import key
    var key = await Passkey.importPublicKeyAsCryptoKey(publicKey);

    // Convert signature from ASN.1 sequence to "raw" format
    var usignature = new Uint8Array(signature);
    var rStart = usignature[4] === 0 ? 5 : 4;
    var rEnd = rStart + 32;
    var sStart = usignature[rEnd + 2] === 0 ? rEnd + 3 : rEnd + 2;
    var r = usignature.slice(rStart, rEnd);
    var s = usignature.slice(sStart);
    var rawSignature = new Uint8Array([...r, ...s]);

    // check signature with public key and signed data 
    var verified = await crypto.subtle.verify(
      <EcdsaParams>{ name: "ECDSA", namedCurve: "P-256", hash: { name: "SHA-256" } },
      key!,
      rawSignature,
      signedData.buffer
    );

    return { isValid: verified, signature: rawSignature, data: signedData };
  }

	static normalizeSignature(signature: ArrayBuffer): { r: bigint; s: bigint } {
		// Convert signature from ASN.1 sequence to "raw" format
		const usignature = new Uint8Array(signature);
		const rStart = usignature[4] === 0 ? 5 : 4;
		const rEnd = rStart + 32;
		const sStart = usignature[rEnd + 2] === 0 ? rEnd + 3 : rEnd + 2;
		const r = BigInt(`0x${Passkey.buf2hex(usignature.slice(rStart, rEnd))}`);
		let s = BigInt(`0x${Passkey.buf2hex(usignature.slice(sStart))}`);

		// Avoid malleability. Ensure low S (<= N/2 where N is the curve order)
		const n = BigInt(
			"0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551",
		);
		if (s > n / BigInt(2)) {
			s = n - s;
		}
		return { r, s };
	}

	static buf2hex(buffer: ArrayBuffer) {
		return [...new Uint8Array(buffer)]
			.map((x) => x.toString(16).padStart(2, "0"))
			.join("");
	}

	static hex2buf(hex: string) {
		return new Uint8Array(
			hex.match(/[\da-f]{2}/gi)!.map((h) => parseInt(h, 16)),
		);
	}

	static parseBase64url(txt: string): ArrayBuffer {
		const base64Txt = txt.replaceAll("-", "+").replaceAll("_", "/"); // base64url -> base64
		return Passkey.toBuffer(atob(base64Txt));
	}

	static toBuffer(txt: string): ArrayBuffer {
		return Uint8Array.from(txt, (c) => c.charCodeAt(0)).buffer;
	}

	static toBase64url(buffer: ArrayBuffer): string {
		const txt = btoa(Passkey.parseBuffer(buffer)); // base64
		return txt.replaceAll("+", "-").replaceAll("/", "_");
	}

	static parseBuffer(buffer: ArrayBuffer): string {
		return String.fromCharCode(...new Uint8Array(buffer));
	}
}
