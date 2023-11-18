const { MongoClient } = require("mongodb");
const Db = process.env.MONGO_URI;
const client = new MongoClient(Db, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

var _db;

module.exports = {
  connectToServer: async function () {
    await client.connect(Db);
    _db = client.db("mongodb");
    console.log("Connected to MongoDB");
  },
  getDb: async function () {
    return _db;
  },
};
