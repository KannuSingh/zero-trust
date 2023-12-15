import { poseidon1, poseidon10, poseidon11, poseidon12, poseidon13, poseidon14, poseidon15, poseidon16, poseidon2, poseidon3, poseidon4, poseidon5, poseidon6, poseidon7, poseidon8, poseidon9 } from "poseidon-lite";
import { randomBytes } from "ethers"
import { BigNumber } from "@ethersproject/bignumber"


export function checkParameter(value: any, name: string, type: string) {
  if (typeof value !== type) {
      throw new TypeError(`Parameter '${name}' is not a ${type}`)
  }
}
/**
 * Checks if a string is a JSON.
 * @param jsonString The JSON string.
 * @returns True or false.
 */
export function isJsonArray(jsonString: string) {
  try {
      return Array.isArray(JSON.parse(jsonString))
  } catch (error) {
      return false
  }
}

/**
 * Generates a random big number.
 * @param numberOfBytes The number of bytes of the number.
 * @returns The generated random number.
 */
export function genRandomNumber(numberOfBytes = 31): bigint {
  return BigNumber.from(randomBytes(numberOfBytes)).toBigInt()
}

export function padArrayWithZeros(array: bigint[]): bigint[] {
  const paddedArray = [...array];
  while (paddedArray.length < 16) {
    paddedArray.push(BigInt(0));
  }
  return paddedArray;
}

export function poseidon(input: bigint[]): bigint {
  const length = input.length;
  switch (length) {
    case 1: return poseidon1(input);
    case 2: return poseidon2(input);
    case 3: return poseidon3(input);
    case 4: return poseidon4(input);
    case 5: return poseidon5(input);
    case 6: return poseidon6(input);
    case 7: return poseidon7(input);
    case 8: return poseidon8(input);
    case 9: return poseidon9(input);
    case 10: return poseidon10(input);
    case 11: return poseidon11(input);
    case 12: return poseidon12(input);
    case 13: return poseidon13(input);
    case 14: return poseidon14(input);
    case 15: return poseidon15(input);
    case 16: return poseidon16(input);
    default: throw new Error(`poseidon: Unsupported array length: ${length}`);
  }
}