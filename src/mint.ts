import { mintTo, burn, createBurnInstruction, getOrCreateAssociatedTokenAccount, createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from '@solana/spl-token';
import { Connection, Keypair, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import bs58 from 'bs58';

// Environment variables should be validated
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const TOKEN_MINT_ADDRESS = process.env.TOKEN_MINT_ADDRESS;
const RPC_ENDPOINT = process.env.RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const API_KEY = process.env.HELIUS_API_KEY;

// Validate required environment variables
if (!PRIVATE_KEY) {
  throw new Error('PRIVATE_KEY environment variable is not set');
}

if (!TOKEN_MINT_ADDRESS) {
  throw new Error('TOKEN_MINT_ADDRESS environment variable is not set');
}

// Create connection with API key if provided
const connection = API_KEY 
  ? new Connection(`${RPC_ENDPOINT}?api-key=${API_KEY}`) 
  : new Connection(RPC_ENDPOINT);

/**
 * Convert a bs58 encoded private key to a Solana Keypair
 * @param bs58PrivateKey The private key in bs58 format
 * @returns Keypair instance
 */
function bs58ToKeypair(bs58PrivateKey: string): Keypair {
  try {
    const privateKeyBuffer = bs58.decode(bs58PrivateKey);
    return Keypair.fromSecretKey(privateKeyBuffer);
  } catch (error: any) {
    throw new Error(`Invalid bs58 private key: ${error.message}`);
  }
}

// Create keypair from private key
const keypair = bs58ToKeypair(PRIVATE_KEY);

/**
 * Mint tokens to an address
 * @param toAddress The address to mint tokens to
 * @param amount Amount to mint (in smallest units)
 * @returns Transaction signature
 */
export const mintToken = async (toAddress: string, amount: number): Promise<string> => {
  try {
    if (!toAddress || !amount || amount <= 0) {
      throw new Error('Invalid toAddress or amount');
    }

    const toPublicKey = new PublicKey(toAddress);
    const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);

    // Get or create associated token account for the destination
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintPublicKey,
      toPublicKey
    );

    // Mint tokens to the associated token account
    const signature = await mintTo(
      connection,
      keypair,
      mintPublicKey,
      associatedTokenAccount.address,
      keypair,
      amount
    );

    console.log(`Minted ${amount} tokens to ${toAddress}. Signature: ${signature}`);
    return signature;
  } catch (error: any) {
    console.error('Error minting tokens:', error);
    throw error;
  }
};

/**
 * Burn tokens from an address
 * @param fromAddress The address to burn tokens from
 * @param amount Amount to burn (in smallest units)
 * @returns Transaction signature
 */
export const burnToken = async (fromAddress: string, amount: number): Promise<string> => {
  try {
    if (!fromAddress || !amount || amount <= 0) {
      throw new Error('Invalid fromAddress or amount');
    }

    const fromPublicKey = new PublicKey(fromAddress);
    const mintPublicKey = new PublicKey(TOKEN_MINT_ADDRESS);

    // Get the associated token account for the source
    const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintPublicKey,
      fromPublicKey
    );

    // Burn tokens from the associated token account
    const signature = await burn(
      connection,
      keypair,
      associatedTokenAccount.address,
      mintPublicKey,
      keypair,
      amount
    );

    console.log(`Burned ${amount} tokens from ${fromAddress}. Signature: ${signature}`);
    return signature;
  } catch (error: any) {
    console.error('Error burning tokens:', error);
    throw error;
  }
};

/**
 * Transfer native SOL tokens between addresses
 * @param toAddress The address to send SOL to
 * @param amount Amount to send in lamports
 * @returns Transaction signature
 */
export const nativeToken = async (toAddress: string, amount: number): Promise<string> => {
  try {
    if (!toAddress || !amount || amount <= 0) {
      throw new Error('Invalid toAddress or amount');
    }

    const toPublicKey = new PublicKey(toAddress);
    
    // Create and sign a transaction to transfer SOL
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: toPublicKey,
        lamports: amount,
      })
    );

    // Send and confirm the transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);

    console.log(`Transferred ${amount} lamports to ${toAddress}. Signature: ${signature}`);
    return signature;
  } catch (error: any) {
    console.error('Error transferring native SOL:', error);
    throw error;
  }
};