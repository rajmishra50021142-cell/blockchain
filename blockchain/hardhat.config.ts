import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from project root .env if present
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, ".env") });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : 31337,
    },
    localhost: {
      url: process.env.RPC_URL || "http://127.0.0.1:8545",
      chainId: process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : 31337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
