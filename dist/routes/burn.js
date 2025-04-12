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
Object.defineProperty(exports, "__esModule", { value: true });
exports.burnTokens = burnTokens;
const spl_token_1 = require("@solana/spl-token");
function burnTokens(connection, payer, mintPublicKey, ownerPublicKey, amount) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenAccount = yield (0, spl_token_1.getOrCreateAssociatedTokenAccount)(connection, payer, mintPublicKey, ownerPublicKey);
        const signature = yield (0, spl_token_1.burn)(connection, payer, tokenAccount.address, mintPublicKey, payer, amount);
        return signature;
    });
}
