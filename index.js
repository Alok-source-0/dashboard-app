const express = require('express')
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const app = express()
const { mongoose, connectDB } = require('./models/indes')

// Connect to Database
connectDB();

app.use(cors());

// For POST requests
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/', require('./routes/routes'))

// Serve Static Files from Angular Dist
app.use(express.static(path.join(__dirname, 'dist/dashboard-temp/browser')));

// Handle Angular Routing (Redirect all other requests to index.html)
app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist/dashboard-temp/browser/index.html'));
});

// Routes
const dbConnection = mongoose.connection;
dbConnection.once("open", (_) => {
    // console.log(`Database connected`);
});

dbConnection.on("error", (err) => {
    console.error(`connection error: ${err}`);
});

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})  