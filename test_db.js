require('dotenv').config();
const { MongoClient } = require('mongodb');

// Standard Node.js Driver Test
async function run() {
    const uri = process.env.MONGO_URI;
    console.log("Testing connection to:", uri.replace(/:([^:@]+)@/, ':****@')); // Hide password in logs

    const client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000
    });

    try {
        console.log("Attempting to connect...");
        await client.connect();
        console.log("SUCCESS: Connected correctly to server");
        
        const db = client.db('ralok3303_db_user');
        console.log("Database checked:", db.databaseName);
        
        // Optional: List collections to verify read access
        const collections = await db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

    } catch (err) {
        console.error("FAILURE: Connection Failed");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);
        
        if (err.message.includes('bad auth')) {
            console.log("Hint: Password or Username is incorrect.");
        } else if (err.message.includes('querySrv ETIMEOUT') || err.message.includes('ETIMEDOUT')) {
            console.log("Hint: Network firewall, IP whitelist, or DNS issue.");
        }
    } finally {
        await client.close();
    }
}

run();
