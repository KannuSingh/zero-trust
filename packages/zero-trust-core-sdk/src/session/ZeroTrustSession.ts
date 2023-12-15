import hash from "js-sha512"
import { checkParameter, genRandomNumber, isJsonArray, padArrayWithZeros, poseidon } from "./utils"
import { poseidon1, poseidon16, poseidon2, poseidon3 } from "poseidon-lite"
import { logger } from "../logger"

export class ZeroTrustSession {
    private _trapdoor: bigint
    private _nullifier: bigint
    private _applicationScopeHash:bigint
    private _secret: bigint
    private _commitment: bigint
    
    constructor(applicationScopes: { [contract: string]: string[] }, identityOrMessage?: string) {
      if (identityOrMessage === undefined) {
        this._trapdoor = genRandomNumber();
        this._nullifier = genRandomNumber();
      } else {
        checkParameter(identityOrMessage, "identityOrMessage", "string");
    
        [this._trapdoor, this._nullifier] = this.generateTrapdoorAndNullifier(identityOrMessage);
      }
    
      this._applicationScopeHash = this.calculateApplicationScopeHash(applicationScopes);
      this._secret = poseidon3([this._nullifier, this._trapdoor, this._applicationScopeHash]);
      this._commitment = poseidon1([this._secret]);
    }
    
    private generateTrapdoorAndNullifier(identityOrMessage: string): [bigint, bigint] {
      if (isJsonArray(identityOrMessage)) {
        const [trapdoor, nullifier] = JSON.parse(identityOrMessage);
        return [BigInt(trapdoor), BigInt(nullifier)];
      } else {
        const h = hash.sha512(identityOrMessage).padStart(128, "0");
        const trapdoor = BigInt(`0x${h.slice(64)}`) >> BigInt(3);
        const nullifier = BigInt(`0x${h.slice(0, 64)}`) >> BigInt(3);
        return [trapdoor, nullifier];
      }
    }


    private calculateApplicationScopeHash(scopes:{ [contract: string]: string[] }):bigint{
      logger.debug(scopes)
      const contractCount = Object.keys(scopes).length;

      if (!scopes || contractCount <= 0 || contractCount > 16) {
        throw new Error('Application Scope must have 1 to 16 contracts.');
      }
      const entries = Object.entries(scopes)
      const applicationContractsPoseidonSet = entries.map(contractLevelScope => {
        const contract = BigInt(contractLevelScope[0])
        const methodSelectors = padArrayWithZeros(contractLevelScope[1].map(selector => BigInt(selector)))
        
        const methodSelectorPoseidonHash = poseidon16(methodSelectors)
        return poseidon2([contract,methodSelectorPoseidonHash])
      })
      return poseidon(applicationContractsPoseidonSet);
    }

    /**
     * Returns the identity trapdoor.
     * @returns The identity trapdoor.
     */
    public get trapdoor(): bigint {
        return this._trapdoor
    }

    /**
     * Returns the identity trapdoor.
     * @returns The identity trapdoor.
     */
    public getTrapdoor(): bigint {
        return this._trapdoor
    }

    /**
     * Returns the identity nullifier.
     * @returns The identity nullifier.
     */
    public get nullifier(): bigint {
        return this._nullifier
    }

    /**
     * Returns the identity nullifier.
     * @returns The identity nullifier.
     */
    public getNullifier(): bigint {
        return this._nullifier
    }

    /**
     * Returns the session scopes hash.
     * @returns The session scopes hash.
     */
    public get scopeSetHash(): bigint {
      return this._applicationScopeHash
  }

  /**
   * Returns the session scopes hash.
   * @returns The session scopes hash.
   */
  public getScopeSetHash(): bigint {
      return this._applicationScopeHash
  }

    /**
     * Returns the identity secret.
     * @returns The identity secret.
     */
    public get secret(): bigint {
        return this._secret
    }

    /**
     * Returns the identity secret.
     * @returns The identity secret.
     */
    public getSecret(): bigint {
        return this._secret
    }

    /**
     * Returns the identity commitment.
     * @returns The identity commitment.
     */
    public get commitment(): bigint {
        return this._commitment
    }

    /**
     * Returns the identity commitment.
     * @returns The identity commitment.
     */
    public getCommitment(): bigint {
        return this._commitment
    }

    /**
     * Returns a JSON string with trapdoor and nullifier. It can be used
     * to export the identity and reuse it later.
     * @returns The string representation of the identity.
     */
    public toIdentityString(): string {
        return JSON.stringify([`0x${this._trapdoor.toString(16)}`, `0x${this._nullifier.toString(16)}`])
    }

    /**
     * Returns a JSON string with trapdoor and nullifier. It can be used
     * to export the identity and reuse it later.
     * @returns The string representation of the identity.
     */
    public toString(): string {
      return JSON.stringify([`0x${this._trapdoor.toString(16)}`, `0x${this._nullifier.toString(16)}`,`0x${this._applicationScopeHash.toString(16)}`])
  }
}