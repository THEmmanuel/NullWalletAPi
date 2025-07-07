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

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

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
    // Check if JWT secrets are configured
    if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
        console.error('JWT secrets not configured! Please set JWT_SECRET and JWT_REFRESH_SECRET environment variables');
        throw new Error('JWT configuration missing. Please set JWT_SECRET and JWT_REFRESH_SECRET environment variables.');
    }
    
    console.log('Generating tokens with configured secrets...');
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

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Authentication]
 *     description: Register a new user with either password-based or token-based authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authMethod
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address (required for password auth)
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: User password (required for password auth, must contain uppercase, lowercase, number, and special character)
 *               authMethod:
 *                 type: string
 *                 enum: [password, token]
 *                 description: Authentication method to use
 *             example:
 *               email: "user@example.com"
 *               password: "SecurePass123!"
 *               authMethod: "password"
 *     responses:
 *       201:
 *         description: Account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: Unique user identifier
 *                     token:
 *                       type: string
 *                       description: Authentication token (for token-based auth)
 *                     walletAddress:
 *                       type: string
 *                       description: Generated Ethereum wallet address
 *                     message:
 *                       type: string
 *                       description: Success message
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get access tokens
 *     tags: [Authentication]
 *     description: Login with either password or token authentication method
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - authMethod
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email (required for password auth)
 *               password:
 *                 type: string
 *                 description: User password (required for password auth)
 *               token:
 *                 type: string
 *                 description: Authentication token (required for token auth)
 *               authMethod:
 *                 type: string
 *                 enum: [password, token]
 *                 description: Authentication method to use
 *             example:
 *               email: "user@example.com"
 *               password: "SecurePass123!"
 *               authMethod: "password"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       description: User identifier
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *                     message:
 *                       type: string
 *                       description: Success message
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid credentials or unverified email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Login routes
router.post('/login', loginLimiter, async (req, res) => {
    console.log('=== LOGIN REQUEST START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    try {
        const { email, password, token, authMethod } = req.body;
        console.log('Extracted fields:', { 
            email: email ? `${email.substring(0, 3)}***` : 'undefined', 
            password: password ? '***' : 'undefined', 
            token: token ? `${token.substring(0, 10)}***` : 'undefined', 
            authMethod 
        });

        if (!authMethod) {
            console.log('ERROR: No authMethod provided');
            return res.status(400).json({
                success: false,
                error: { code: 'AUTH_001', message: 'Authentication method is required' }
            });
        }

        console.log(`Processing ${authMethod} authentication`);

        if (authMethod === 'password') {
            console.log('=== PASSWORD AUTH FLOW ===');
            
            if (!email || !password) {
                console.log('ERROR: Missing email or password');
                console.log('Email provided:', !!email);
                console.log('Password provided:', !!password);
                return res.status(400).json({
                    success: false,
                    error: { code: 'AUTH_001', message: 'Email and password are required' }
                });
            }

            console.log('Looking for user with email and password auth method...');
            const user = await Users.findOne({ email, authMethod: 'password' });
            console.log('User lookup result:', user ? `Found user ID: ${user.userID}` : 'No user found');
            
            if (!user) {
                console.log('ERROR: User not found with email and password auth method');
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_001', message: 'Invalid credentials' }
                });
            }

            console.log('Checking email verification status...');
            console.log('isEmailVerified:', user.isEmailVerified);
            
            // Allow login regardless of email verification status
            if (!user.isEmailVerified) {
                console.log('WARNING: User email not verified, but allowing login');
            }

            console.log('Comparing password with bcrypt...');
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log('Password comparison result:', isValidPassword);
            
            if (!isValidPassword) {
                console.log('ERROR: Password comparison failed');
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_001', message: 'Invalid credentials' }
                });
            }

            console.log('Generating JWT tokens...');
            const { accessToken, refreshToken } = generateTokens(user.userID);
            console.log('Tokens generated successfully');

            console.log('=== PASSWORD AUTH SUCCESS ===');
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
            console.log('=== TOKEN AUTH FLOW ===');
            
            if (!token) {
                console.log('ERROR: No token provided');
                return res.status(400).json({
                    success: false,
                    error: { code: 'AUTH_002', message: 'Token is required' }
                });
            }

            console.log('Hashing provided token...');
            const hashedToken = hashToken(token);
            console.log('Token hashed successfully');

            console.log('Looking for user with hashed token and token auth method...');
            const user = await Users.findOne({ token: hashedToken, authMethod: 'token' });
            console.log('User lookup result:', user ? `Found user ID: ${user.userID}` : 'No user found');
            
            if (!user) {
                console.log('ERROR: User not found with provided token');
                console.log('Searched for token hash:', hashedToken.substring(0, 10) + '***');
                return res.status(401).json({
                    success: false,
                    error: { code: 'AUTH_002', message: 'Invalid token' }
                });
            }

            console.log('Generating JWT tokens...');
            const { accessToken, refreshToken } = generateTokens(user.userID);
            console.log('Tokens generated successfully');

            console.log('=== TOKEN AUTH SUCCESS ===');
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

        console.log('ERROR: Invalid authentication method:', authMethod);
        return res.status(400).json({
            success: false,
            error: { code: 'AUTH_001', message: 'Invalid authentication method' }
        });
    } catch (error) {
        console.error('=== LOGIN ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        
        res.status(500).json({
            success: false,
            error: { 
                code: 'AUTH_001', 
                message: 'Error during login',
                details: error.message
            }
        });
    } finally {
        console.log('=== LOGIN REQUEST END ===');
    }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     description: Send password reset instructions to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *             example:
 *               email: "user@example.com"
 *     responses:
 *       200:
 *         description: Password reset instructions sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset instructions sent to your email"
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many password reset attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     description: Reset user password using the token from forgot-password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token from email
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (must contain uppercase, lowercase, number, and special character)
 *             example:
 *               token: "reset_token_here"
 *               newPassword: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Password reset successful"
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/forgot-token:
 *   post:
 *     summary: Request token recovery
 *     tags: [Authentication]
 *     description: Send token recovery instructions to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *             example:
 *               email: "user@example.com"
 *     responses:
 *       200:
 *         description: Token recovery instructions sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token recovery instructions sent to your email"
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Too many token recovery attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/auth/verify-token-recovery:
 *   post:
 *     summary: Verify token recovery and get new token
 *     tags: [Authentication]
 *     description: Verify recovery token and generate new authentication token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - email
 *             properties:
 *               token:
 *                 type: string
 *                 description: Recovery token from email
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email address
 *             example:
 *               token: "recovery_token_here"
 *               email: "user@example.com"
 *     responses:
 *       200:
 *         description: Token recovery successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     newToken:
 *                       type: string
 *                       description: New authentication token
 *                     message:
 *                       type: string
 *                       example: "Token recovery successful"
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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