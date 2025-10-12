const { MongoClient } = require('mongodb');
MongoClient.connect('mongodb://localhost:27017')
    .then(() => console.log('✅ MongoDB is running!'))
    .catch(err => console.log('❌ Error:', err.message));
