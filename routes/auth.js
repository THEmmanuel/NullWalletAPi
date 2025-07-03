const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Users } = require('../models/user');
const rateLimit = require('express-rate-limit');
const { 
    createEthWallet, 
    initializeUserChains, 
    initializeUserTokens, 
    initializeTokenBalances 
} = require('../services/EthWallet');
const { generateWalletAddress } = require('../modules/nullnet/utils/wallet');

// Rate limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: { success: false, error: { code: 'AUTH_004', message: 'Too many login attempts' } }
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: { success: false, error: { code: 'AUTH_004', message: 'Too many password reset attempts' } }
});

const tokenRecoveryLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts
    message: { success: false, error: { code: 'AUTH_004', message: 'Too many token recovery attempts' } }
});

// Helper functions
const generateSecureToken = () => {
    const buffer = crypto.randomBytes(32);
    return buffer.toString('hex');
};

const hashToken = (token) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

// Helper function to create nullnet wallet
const createNullNetWallet = async () => {
    // Use the specific address if you want, or generate a new one
    // const walletAddress = 'null_3he83rds393erfr3'; // Fixed address as requested
    const walletAddress = await generateWalletAddress(); // Or generate a unique one
    
    return {
        walletName: "NullNet Wallet",
        walletAddress: walletAddress,
        walletKey: null, // NullNet doesn't use private keys like Ethereum
        walletPhrase: null // NullNet doesn't use mnemonic phrases
    };
};

// Signup routes
router.post('/signup', async (req, res) => {
    try {
        const { email, password, authMethod } = req.body;
        console.log('Signup request received:', { email, authMethod });

        if (authMethod === 'password') {
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'AUTH_006', message: 'Email and password are required' }
                });
            }

            // Password validation
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'AUTH_007', message: 'Password does not meet requirements' }
                });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            
            // Create ETH wallet
            const ethWallet = createEthWallet();
            
            // Create NullNet wallet
            const nullNetWallet = await createNullNetWallet();
            
            // Initialize all supported chains and tokens
            const supportedChains = initializeUserChains();
            const supportedTokens = initializeUserTokens();
            const tokenBalances = initializeTokenBalances();
            
            const user = new Users({
                email,
                password: hashedPassword,
                authMethod: 'password',
                userID: Date.now().toString(),
                isEmailVerified: false,
                username: `user_${Date.now()}`,
                userWallets: [ethWallet, nullNetWallet],
                supportedChains,
                supportedTokens,
                tokenBalances,
                currentChain: 'ethereum'
            });

            await user.save();

            // TODO: Send verification email

            return res.status(201).json({
                success: true,
                data: {
                    userId: user.userID,
                    walletAddress: ethWallet.walletAddress,
                    message: 'Account created successfully. Please verify your email.'
                }
            });
        } else if (authMethod === 'token') {
            console.log('Processing token-based signup');
            const token = generateSecureToken();
            const hashedToken = hashToken(token);
            
            console.log('Generated token and hash');

            // Create ETH wallet
            const ethWallet = createEthWallet();
            
            // Create NullNet wallet
            const nullNetWallet = await createNullNetWallet();
            
            // Initialize all supported chains and tokens
            const supportedChains = initializeUserChains();
            const supportedTokens = initializeUserTokens();
            const tokenBalances = initializeTokenBalances();
            
            const user = new Users({
                email: email || null,
                authMethod: 'token',
                userID: Date.now().toString(),
                token: hashedToken,
                isEmailVerified: email ? false : true,
                username: `user_${Date.now()}`,
                userWallets: [ethWallet, nullNetWallet],
                supportedChains,
                supportedTokens,
                tokenBalances,
                currentChain: 'ethereum'
            });

            console.log('Created user object:', { userID: user.userID, email: user.email });

            await user.save();
            console.log('User saved successfully');

            return res.status(201).json({
                success: true,
                data: {
                    userId: user.userID,
                    token,
                    walletAddress: ethWallet.walletAddress,
                    message: 'Token-based account created successfully'
                }
            });
        }

        return res.status(400).json({
            success: false,
            error: { code: 'AUTH_001', message: 'Invalid authentication method' }
        });
    } catch (error) {
        console.error('Detailed signup error:', error);
        res.status(500).json({
            success: false,
            error: { 
                code: 'AUTH_001', 
                message: 'Error creating account',
                details: error.message
            }
        });
    }
});

// Login routes
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, token, authMethod } = req.body;

        if (authMethod === 'password') {
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'AUTH_001', message: 'Email and password are required' }
                });
            }

            const user = await Users.findOne({ email, authMethod: 'password' });
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_001', message: 'Invalid credentials' }
                });
            }

            if (!user.isEmailVerified) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_005', message: 'Email not verified' }
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_001', message: 'Invalid credentials' }
                });
            }

            const { accessToken, refreshToken } = generateTokens(user.userID);

            return res.json({
                success: true,
                data: {
                    userId: user.userID,
                    accessToken,
                    refreshToken,
                    message: 'Login successful'
                }
            });
        } else if (authMethod === 'token') {
            if (!token) {
                return res.status(400).json({
                    success: false,
                    error: { code: 'AUTH_002', message: 'Token is required' }
                });
            }

            const hashedToken = hashToken(token);
            const user = await Users.findOne({ token: hashedToken, authMethod: 'token' });
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_002', message: 'Invalid token' }
                });
            }

            const { accessToken, refreshToken } = generateTokens(user.userID);

            return res.json({
                success: true,
                data: {
                    userId: user.userID,
                    accessToken,
                    refreshToken,
                    message: 'Login successful'
                }
            });
        }

        return res.status(400).json({
            success: false,
            error: { code: 'AUTH_001', message: 'Invalid authentication method' }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'AUTH_001', message: 'Error during login' }
        });
    }
});

// Password reset routes
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Users.findOne({ email, authMethod: 'password' });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { code: 'AUTH_009', message: 'Email not found' }
            });
        }

        const resetToken = generateSecureToken();
        const hashedToken = hashToken(resetToken);
        
        user.resetToken = hashedToken;
        user.resetTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // TODO: Send password reset email

        res.json({
            success: true,
            message: 'Password reset instructions sent to your email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'AUTH_001', message: 'Error processing request' }
        });
    }
});

router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const hashedToken = hashToken(token);

        const user = await Users.findOne({
            resetToken: hashedToken,
            resetTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: { code: 'AUTH_003', message: 'Invalid or expired token' }
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'AUTH_001', message: 'Error resetting password' }
        });
    }
});

// Token recovery routes
router.post('/forgot-token', tokenRecoveryLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await Users.findOne({ email, authMethod: 'token' });

        if (!user) {
            return res.status(404).json({
                success: false,
                error: { code: 'AUTH_009', message: 'Email not found' }
            });
        }

        const recoveryToken = generateSecureToken();
        const hashedToken = hashToken(recoveryToken);
        
        user.recoveryToken = hashedToken;
        user.recoveryTokenExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        await user.save();

        // TODO: Send token recovery email

        res.json({
            success: true,
            message: 'Token recovery instructions sent to your email'
        });
    } catch (error) {
        console.error('Forgot token error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'AUTH_001', message: 'Error processing request' }
        });
    }
});

router.post('/verify-token-recovery', async (req, res) => {
    try {
        const { token, email } = req.body;
        const hashedToken = hashToken(token);

        const user = await Users.findOne({
            email,
            recoveryToken: hashedToken,
            recoveryTokenExpiry: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: { code: 'AUTH_003', message: 'Invalid or expired token' }
            });
        }

        const newToken = generateSecureToken();
        const hashedNewToken = hashToken(newToken);
        
        user.token = hashedNewToken;
        user.recoveryToken = undefined;
        user.recoveryTokenExpiry = undefined;
        await user.save();

        res.json({
            success: true,
            data: {
                newToken,
                message: 'Token recovery successful'
            }
        });
    } catch (error) {
        console.error('Token recovery error:', error);
        res.status(500).json({
            success: false,
            error: { code: 'AUTH_001', message: 'Error recovering token' }
        });
    }
});

module.exports = router;