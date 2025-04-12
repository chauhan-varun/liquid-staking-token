import { mintTo } from '@solana/spl-token';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;

const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=ec2b6ab3-3887-4a0a-9dff-fe83a3817fef");

function bs58ToKeypair (bs58PrivateKey: string) {
  try {
    console.log(bs58PrivateKey);
    const privateKeyBuffer = bs58.decode(bs58PrivateKey);
    return Keypair.fromSecretKey(privateKeyBuffer);
  } catch (e) {
    throw new Error("invalid bs58 private key");
  } 
  
}

const keypair = bs58ToKeypair(PRIVATE_KEY!);

export const mintToken = async (fromAddress: string, amount: number) => {
  await mintTo(connection, keypair, new PublicKey(TOKEN_MINT_ADDRESS!), new PublicKey(fromAddress), keypair, amount);
  
}

export const burnToken = async (fromAddress: string, toAddress: string, amount: number) => {
  console.log("token burnt");
  
}

export const nativeToken = async (fromAddress: string, toAddress: string, amount: number) => {
  console.log("native token");
  
}