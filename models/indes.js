const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const credential = process.env.MONGO_URI;
        
        if (!credential) {
            throw new Error("MONGO_URI not found in .env file");
        }
        
        await mongoose.connect(credential, {
            serverSelectionTimeoutMS: 5000 
        });
        console.log('Connected to MongoDB');
    } catch (err) {
        console.error("Error connecting to database: ", err.message);
        process.exit(1); 
    }
};

module.exports = {
    mongoose,
    connectDB
}
