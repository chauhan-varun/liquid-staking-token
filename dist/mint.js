"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nativeToken = exports.burnToken = exports.mintToken = void 0;
const spl_token_1 = require("@solana/spl-token");
const web3_js_1 = require("@solana/web3.js");
const bs58_1 = __importDefault(require("bs58"));
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
    ? new web3_js_1.Connection(`${RPC_ENDPOINT}?api-key=${API_KEY}`)
    : new web3_js_1.Connection(RPC_ENDPOINT);
/**
 * Convert a bs58 encoded private key to a Solana Keypair
 * @param bs58PrivateKey The private key in bs58 format
 * @returns Keypair instance
 */
function bs58ToKeypair(bs58PrivateKey) {
    try {
        const privateKeyBuffer = bs58_1.default.decode(bs58PrivateKey);
        return web3_js_1.Keypair.fromSecretKey(privateKeyBuffer);
    }
    catch (error) {
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
const mintToken = (toAddress, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!toAddress || !amount || amount <= 0) {
            throw new Error('Invalid toAddress or amount');
        }
        const toPublicKey = new web3_js_1.PublicKey(toAddress);
        const mintPublicKey = new web3_js_1.PublicKey(TOKEN_MINT_ADDRESS);
        // Get or create associated token account for the destination
        const associatedTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, keypair, mintPublicKey, toPublicKey);
        // Mint tokens to the associated token account
        const signature = yield (0, spl_token_1.mintTo)(connection, keypair, mintPublicKey, associatedTokenAccount.address, keypair, amount);
        console.log(`Minted ${amount} tokens to ${toAddress}. Signature: ${signature}`);
        return signature;
    }
    catch (error) {
        console.error('Error minting tokens:', error);
        throw error;
    }
});
exports.mintToken = mintToken;
/**
 * Burn tokens from an address
 * @param fromAddress The address to burn tokens from
 * @param amount Amount to burn (in smallest units)
 * @returns Transaction signature
 */
const burnToken = (fromAddress, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!fromAddress || !amount || amount <= 0) {
            throw new Error('Invalid fromAddress or amount');
        }
        const fromPublicKey = new web3_js_1.PublicKey(fromAddress);
        const mintPublicKey = new web3_js_1.PublicKey(TOKEN_MINT_ADDRESS);
        // Get the associated token account for the source
        const associatedTokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, keypair, mintPublicKey, fromPublicKey);
        // Burn tokens from the associated token account
        const signature = yield (0, spl_token_1.burn)(connection, keypair, associatedTokenAccount.address, mintPublicKey, keypair, amount);
        console.log(`Burned ${amount} tokens from ${fromAddress}. Signature: ${signature}`);
        return signature;
    }
    catch (error) {
        console.error('Error burning tokens:', error);
        throw error;
    }
});
exports.burnToken = burnToken;
/**
 * Transfer native SOL tokens between addresses
 * @param toAddress The address to send SOL to
 * @param amount Amount to send in lamports
 * @returns Transaction signature
 */
const nativeToken = (toAddress, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!toAddress || !amount || amount <= 0) {
            throw new Error('Invalid toAddress or amount');
        }
        const toPublicKey = new web3_js_1.PublicKey(toAddress);
        // Create and sign a transaction to transfer SOL
        const transaction = new web3_js_1.Transaction().add(web3_js_1.SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: toPublicKey,
            lamports: amount,
        }));
        // Send and confirm the transaction
        const signature = yield (0, web3_js_1.sendAndConfirmTransaction)(connection, transaction, [keypair]);
        console.log(`Transferred ${amount} lamports to ${toAddress}. Signature: ${signature}`);
        return signature;
    }
    catch (error) {
        console.error('Error transferring native SOL:', error);
        throw error;
    }
});
exports.nativeToken = nativeToken;
