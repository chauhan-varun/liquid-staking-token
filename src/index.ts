import 'dotenv/config';
import express, { Request, Response } from 'express';
import { burnToken, mintToken, nativeToken } from './mint';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(express.json());

// Define your vault address from environment variables or set it directly
const VAULT_ADDRESS = process.env.VAULT_ADDRESS;

// Define transaction types
enum TransactionType {
  RECEIVED_NATIVE_SOL = 'received_native_sol',
  BURN_AND_TRANSFER = 'burn_and_transfer'
}

// Interface for transaction data
interface NativeTransfer {
  amount: number;
  fromUserAccount: string;
  toUserAccount: string;
}

interface TransactionData {
  nativeTransfers?: NativeTransfer[];
}

// Health check endpoint
app.get('/health', (_: Request, res: Response) => {
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
app.post('/helius', (req: Request, res: Response) => {
  (async () => {
    try {
      console.log('Received webhook payload:', JSON.stringify(req.body, null, 2));
      
      // Extract transaction data from request body or fall back to test data if not in production
      const transactionData: TransactionData = req.body || {
        "nativeTransfers": [{ 
          "amount": 10000000, 
          "fromUserAccount": "F1hLtC1BCc3FuATdBfHrAfxE4eJbXH2o3R54izrii1Fi", 
          "toUserAccount": VAULT_ADDRESS
        }]
      };

      // Find any transfer where the destination is our vault
      const incomingTxn = transactionData.nativeTransfers?.find((tx: NativeTransfer) => 
        tx.toUserAccount === VAULT_ADDRESS
      );

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
          const signature = await mintToken(fromUserAccount, amount);
          
          return res.status(200).json({
            success: true,
            message: "Transaction processed successfully",
            type: transactionType,
            signature
          });
        } else if (transactionType === TransactionType.BURN_AND_TRANSFER) {
          // First burn tokens from the sender's account
          const burnSignature = await burnToken(fromUserAccount, amount);
          
          // Then transfer native SOL to the sender (returning their SOL)
          const transferSignature = await nativeToken(fromUserAccount, amount);
          
          return res.status(200).json({
            success: true,
            message: "Burn and transfer completed",
            burnSignature,
            transferSignature
          });
        } else {
          throw new Error(`Unknown transaction type: ${transactionType}`);
        }
      } catch (error: any) {
        console.error(`Error processing transaction: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: "Failed to process transaction",
          error: error.message
        });
      }
    } catch (error: any) {
      console.error(`Server error: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message
      });
    }
  })().catch(err => {
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