const express = require('express');
const router = express.Router();
const { Users } = require('../models/user');
const { createEthWallet } = require('../services/EthWallet');

// Test route
router.get('/test', (req, res) => {
    res.json({ message: 'User routes are working!' });
});

// create new user
router.post('/', async (req, res) => {
    try {
        const { email, username, transactionPIN } = req.body;

        // Validate required fields
        if (!email || !username) {
            return res.status(400).json({ error: 'Email and username are required' });
        }

        // Check if user already exists
        const existingUser = await Users.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).json({ error: 'User with this email or username already exists' });
        }

        // Create ETH wallet for the user
        const ethWallet = createEthWallet();

        // Create new user with wallet
        const newUser = new Users({
            email,
            username,
            userID: Date.now().toString(), // Simple userID generation
            transactionPIN,
            userWallets: [ethWallet],
            currentChain: 'ethereum'
        });

        // Save user to database
        await newUser.save();

        // Return user data (excluding sensitive information)
        const userResponse = {
            email: newUser.email,
            username: newUser.username,
            userID: newUser.userID,
            walletAddress: ethWallet.walletAddress,
            currentChain: newUser.currentChain
        };

        res.status(201).json(userResponse);
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// get user
router.get('/:id', async (req, res) => {
    try {
        const user = await Users.findOne({ userID: req.params.id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: error.message });
    }
});

// get all users
router.get('/', async (req, res) => {
    try {
        const users = await Users.find({});
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: error.message });
    }
});

// delete all users
router.delete('/all', async (req, res) => {
    try {
        await Users.deleteMany({});
        res.json({ message: 'All users deleted successfully' });
    } catch (error) {
        console.error('Error deleting all users:', error);
        res.status(500).json({ error: error.message });
    }
});

// delete a specific user
router.delete('/:id', async (req, res) => {
    try {
        const user = await Users.findOneAndDelete({ userID: req.params.id });
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});

// update a user
router.put('/:id', async (req, res) => {
    try {
        // TODO: Implement update user logic
        res.json({ message: 'Update user endpoint' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// get user by MongoDB _id
router.get('/mongo/:id', async (req, res) => {
    try {
        const user = await Users.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user by MongoDB ID:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;