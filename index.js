require('dotenv').config();
const express = require("express");
const app = express();
const PORT = process.env.PORT;
const cors = require("cors");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');


const MONGO_URI = process.env.MONGO_URI

app.use(bodyParser.urlencoded({
	extended: true
}));

app.use(bodyParser.json());

app.use(cors());

mongoose.connect(MONGO_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log('MongoDB connected!'))
	.catch(err => console.log(err))



app.use(express.json()); // Middleware to parse JSON request bodies
// app.use("/unlock-hash", unlockHashRoutes);
// app.use("/kinetic-keys", kineticKeyRoutes);
// app.use("/users", userRoutes); // Add user routes
// app.use("/assetx", assetXRoutes); // Add assetX routes
// app.use("/transactions", transactionRoutes); // Add assetX routes


app.get("/", (req, res) => {
	res.send("Null Wallet API");
});

app.listen(PORT, () => {
	console.log(`Null Wallet Server listening on port ${PORT}`);
});