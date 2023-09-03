const { MongoClient } = require('mongodb');
// require('dotenv').config();


const uri = 'mongodb://smasher:smasher7712@46.147.243.8:27017/reson';

let cachedDb = null;

async function connectToDatabase() {
  // if (false && cachedDb) {
  //   return Promise.resolve(cachedDb);
  // }

  // Connect to MongoDB
  const client = await MongoClient.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return client;
}

module.exports = { connectToDatabase };
