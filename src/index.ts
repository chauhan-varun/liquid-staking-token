require('dotenv').config();
import express from 'express';
import { burnToken, mintToken, nativeToken } from './mint';

const app = express();

const HELIUS_RESPONSE = {
  "nativeTransfers": [ { 
     "amount": 10000000, 
     "fromUserAccount": "F1hLtC1BCc3FuATdBfHrAfxE4eJbXH2o3R54izrii1Fi", 
     "toUserAccount": "G6WVXCkT7xatjdAwqFAbFRmheVsQ5SEatX1Ew2ZDBZrU" 
 } ] }
 

const VAULT = '6HQXUSqQ1328Y9XyMBg6UJBpDPLiNGEZTsqhRRm2ZAH4';

app.post('/helius', async (req, res) => {
  const incomingTxn = HELIUS_RESPONSE.nativeTransfers.find(x => x.toUserAccount === VAULT);
  if (!incomingTxn) {
    res.json({
      message: "processed"
    })
    return
  }
  const fromAddress = incomingTxn.fromUserAccount;
  const toAddress = incomingTxn.toUserAccount;
  const amount = incomingTxn.amount;
  const type = 'recieved_native_sol';
  await mintToken(fromAddress, amount);

  if(type=== 'recieved_native_sol'){
  } else {
    await burnToken(fromAddress, toAddress, amount);
    await nativeToken(fromAddress, toAddress, amount);
  }
  res.send('transaction successfull');

})

app.listen(3000, ()=>{
  console.log(`server is running on port ${3000}`);
  
})