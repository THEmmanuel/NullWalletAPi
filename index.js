require('dotenv').config();
const express = require("express");
const app = express();
const PORT = process.env.PORT || 4444;
const cors = require("cors");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const paystackRoutes = require('./routes/paystack');

// Import NullNet routes
const nullnetWalletRoutes = require('./modules/nullnet/routes/wallet.routes');
const nullnetAssetRoutes = require('./modules/nullnet/routes/asset.routes');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/null-wallet';

console.log('Starting Null Wallet Backend...');
console.log('PORT:', PORT);
console.log('MONGO_URI:', MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

// Configure CORS to allow frontend requests
app.use(cors({
	origin: process.env.FRONTEND_URL || 'http://localhost:3000',
	credentials: true
}));

mongoose.connect(MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('MongoDB connected!'))
	.catch(err => console.log(err))

app.use(express.json()); // Middleware to parse JSON request bodies

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Null Wallet API Documentation'
}));

// app.use("/unlock-hash", unlockHashRoutes);
// app.use("/kinetic-keys", kineticKeyRoutes);
app.use("/api/auth", authRoutes); // Add auth routes
app.use("/users", userRoutes); // Add user routes
app.use("/wallet", walletRoutes); // Add wallet routes
app.use("/api/paystack", paystackRoutes); // Add Paystack routes

// Add NullNet routes
app.use("/api/nullnet/wallets", nullnetWalletRoutes); // Add NullNet wallet routes
app.use("/api/nullnet/assets", nullnetAssetRoutes); // Add NullNet asset routes

// app.use("/assetx", assetXRoutes); // Add assetX routes
// app.use("/transactions", transacti0onRoutes); // Add assetX routes

app.get("/", (req, res) => {
	res.send("Null Wallet API");
});

app.listen(PORT, () => {
	console.log(`Null Wallet Server listening on port ${PORT}`);
});