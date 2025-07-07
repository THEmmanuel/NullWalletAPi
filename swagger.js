const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Null Wallet API',
      version: '1.0.0',
      description: 'A comprehensive API for managing cryptocurrency wallets, transactions, and assets across multiple blockchains including Ethereum, Flow, and NullNet.',
      contact: {
        name: 'Emmanuel Ayodele Bello',
        email: 'support@nullwallet.com'
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC'
      }
    },
    servers: [
      {
        url: 'http://localhost:4444',
        description: 'Development server'
      },
      {
        url: 'https://api.nullwallet.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            userID: {
              type: 'string',
              description: 'Unique user identifier'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            username: {
              type: 'string',
              description: 'User username'
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            authMethod: {
              type: 'string',
              enum: ['password', 'token'],
              description: 'Authentication method used'
            }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            walletName: {
              type: 'string',
              description: 'Name of the wallet'
            },
            walletAddress: {
              type: 'string',
              description: 'Wallet address'
            },
            walletKey: {
              type: 'string',
              description: 'Encrypted private key (if applicable)'
            },
            walletPhrase: {
              type: 'string',
              description: 'Mnemonic phrase (if applicable)'
            }
          }
        },
        TokenBalance: {
          type: 'object',
          properties: {
            balance: {
              type: 'string',
              description: 'Token balance as string'
            },
            tokenPrice: {
              type: 'number',
              description: 'Current token price in USD'
            },
            usdBalance: {
              type: 'number',
              description: 'Balance value in USD'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code'
                },
                message: {
                  type: 'string',
                  description: 'Error message'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './routes/*.js',
    './modules/nullnet/routes/*.js',
    './modules/nullnet/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs; 