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
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const mint_1 = require("./mint");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware to parse JSON request bodies
app.use(express_1.default.json());
// Define your vault address from environment variables or set it directly
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || '6HQXUSqQ1328Y9XyMBg6UJBpDPLiNGEZTsqhRRm2ZAH4';
// Define transaction types
var TransactionType;
(function (TransactionType) {
    TransactionType["RECEIVED_NATIVE_SOL"] = "received_native_sol";
    TransactionType["BURN_AND_TRANSFER"] = "burn_and_transfer";
})(TransactionType || (TransactionType = {}));
// Health check endpoint
app.get('/health', (_, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
/**
 * Helius webhook endpoint to handle incoming transactions
 * Expected payload structure:
 * {
 *   "nativeTransfers": [
 *     {
 *       "amount": number,
 *       "fromUserAccount": string,
 *       "toUserAccount": string
 *     }
 *   ]
 * }
 */
app.post('/helius', (req, res) => {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        try {
            console.log('Received webhook payload:', JSON.stringify(req.body, null, 2));
            // Extract transaction data from request body or fall back to test data if not in production
            const transactionData = req.body || {
                "nativeTransfers": [{
                        "amount": 10000000,
                        "fromUserAccount": "F1hLtC1BCc3FuATdBfHrAfxE4eJbXH2o3R54izrii1Fi",
                        "toUserAccount": VAULT_ADDRESS
                    }]
            };
            // Find any transfer where the destination is our vault
            const incomingTxn = (_a = transactionData.nativeTransfers) === null || _a === void 0 ? void 0 : _a.find((tx) => tx.toUserAccount === VAULT_ADDRESS);
            // If no relevant transaction is found, return early
            if (!incomingTxn) {
                return res.status(200).json({
                    success: true,
                    message: "No relevant transaction found"
                });
            }
            // Extract transaction details
            const { fromUserAccount, amount } = incomingTxn;
            const transactionType = TransactionType.RECEIVED_NATIVE_SOL; // Default transaction type
            try {
                // Handle transaction based on type
                if (transactionType === TransactionType.RECEIVED_NATIVE_SOL) {
                    // When we receive SOL, mint tokens to the sender
                    const signature = yield (0, mint_1.mintToken)(fromUserAccount, amount);
                    return res.status(200).json({
                        success: true,
                        message: "Transaction processed successfully",
                        type: transactionType,
                        signature
                    });
                }
                else if (transactionType === TransactionType.BURN_AND_TRANSFER) {
                    // First burn tokens from the sender's account
                    const burnSignature = yield (0, mint_1.burnToken)(fromUserAccount, amount);
                    // Then transfer native SOL to the sender (returning their SOL)
                    const transferSignature = yield (0, mint_1.nativeToken)(fromUserAccount, amount);
                    return res.status(200).json({
                        success: true,
                        message: "Burn and transfer completed",
                        burnSignature,
                        transferSignature
                    });
                }
                else {
                    throw new Error(`Unknown transaction type: ${transactionType}`);
                }
            }
            catch (error) {
                console.error(`Error processing transaction: ${error.message}`);
                return res.status(500).json({
                    success: false,
                    message: "Failed to process transaction",
                    error: error.message
                });
            }
        }
        catch (error) {
            console.error(`Server error: ${error.message}`);
            return res.status(500).json({
                success: false,
                message: "Server error",
                error: error.message
            });
        }
    }))().catch(err => {
        console.error('Unhandled promise rejection:', err);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message
        });
    });
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Vault address: ${VAULT_ADDRESS}`);
});
// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    process.exit(0);
});
