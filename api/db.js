const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
let cachedClient = null;

async function getCollection() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, { maxPoolSize: 1 });
    await cachedClient.connect();
  }
  return cachedClient.db('overtime_tracker').collection('attendance');
}

module.exports = { getCollection };
