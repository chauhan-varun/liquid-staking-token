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
// server.ts
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const web3_js_1 = require("@solana/web3.js");
const mint_1 = require("./routes/mint");
const burn_1 = require("./routes/burn");
const send_1 = require("./routes/send");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('devnet'), 'confirmed');
// Replace with your actual private key (NOT SAFE FOR PRODUCTION)
const secretKey = Uint8Array.from([
    97, 4, 92, 22, 135, 78, 181, 144, 32, 222, 2,
    11, 154, 94, 84, 70, 144, 174, 106, 173, 16, 144,
    116, 185, 213, 196, 96, 183, 5, 59, 115, 89, 78,
    126, 83, 236, 195, 164, 101, 147, 174, 211, 126, 249,
    10, 198, 20, 72, 127, 254, 26, 82, 140, 45, 151,
    207, 231, 72, 97, 52, 214, 117, 181, 119
]);
const payer = web3_js_1.Keypair.fromSecretKey(secretKey);
// Replace with your SPL token mint address
const mintAddress = new web3_js_1.PublicKey("8x1zEsi8ypBJLmMVycdS3XWq1Vo8ZTUxoEJU3UgWYKFs");
app.post('/mint', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const to = new web3_js_1.PublicKey(req.body.to);
        const amount = req.body.amount;
        const sig = yield (0, mint_1.mintTokens)(connection, payer, mintAddress, to, amount);
        res.json({ signature: sig });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.post('/burn', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const amount = req.body.amount;
        const sig = yield (0, burn_1.burnTokens)(connection, payer, mintAddress, payer.publicKey, amount);
        res.json({ signature: sig });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.post('/send', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const to = new web3_js_1.PublicKey(req.body.to);
        const amount = req.body.amount;
        const sig = yield (0, send_1.sendNativeTokens)(connection, payer, to, amount);
        res.json({ signature: sig });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
}));
app.listen(3000, () => console.log('Server running on port 3000'));
