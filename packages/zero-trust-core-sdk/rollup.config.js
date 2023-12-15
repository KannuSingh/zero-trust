import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json'
export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'es',
    }
  ],
  plugins: [typescript(), json(),],
  external: [
    'pino',
    'ethers',
    'poseidon-lite',
    'snarkjs',
    'js-sha512',
    '@ethersproject/bignumber'
  ],
};
