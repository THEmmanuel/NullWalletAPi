# Null Wallet Backend

A comprehensive backend API for the Null Wallet application, supporting multiple blockchain networks and token types.

## Features

- Multi-chain wallet support (Ethereum, Flow, etc.)
- User authentication and authorization
- Asset management and transactions
- Paystack integration for payments
- NullNet integration for advanced wallet features
- Rate limiting and security features

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=4444
   NODE_ENV=development

   # Database
   MONGO_URI=mongodb://localhost:27017/null-wallet

   # Frontend URL for CORS
   FRONTEND_URL=http://localhost:3000

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your_jwt_secret_here

   # Paystack Configuration
   PAYSTACK_SECRET_KEY=your_paystack_secret_key
   PAYSTACK_PUBLIC_KEY=your_paystack_public_key

   # Alchemy Configuration (for Ethereum)
   ALCHEMY_API_KEY=your_alchemy_api_key

   # Flow Configuration
   FLOW_ACCESS_NODE_URL=https://access-testnet.onflow.org
   FLOW_PRIVATE_KEY=your_flow_private_key
   FLOW_ACCOUNT_ADDRESS=your_flow_account_address

   # NullNet Configuration
   NULLNET_API_KEY=your_nullnet_api_key
   NULLNET_BASE_URL=https://api.nullnet.com
   ```

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

The server will start on `http://localhost:4444`

## Vercel Deployment

### Prerequisites

- Vercel account
- Vercel CLI (optional)

### Deployment Steps

1. **Install Vercel CLI (optional):**
   ```bash
   npm i -g vercel
   ```

2. **Deploy using Vercel Dashboard:**
   - Connect your GitHub repository to Vercel
   - Vercel will automatically detect the Node.js project
   - The `vercel.json` file is already configured for proper deployment

3. **Set Environment Variables in Vercel:**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add all the environment variables from the `.env` file above
   - Make sure to set `NODE_ENV=production`

4. **Deploy:**
   - If using CLI: `vercel --prod`
   - If using dashboard: Push to your main branch

### Important Notes for Vercel

- The `vercel.json` file is configured to route all requests to `index.js`
- The app exports the Express instance for Vercel's serverless environment
- Local development still works with `npm run dev`
- Production uses `npm start` (node instead of nodemon)

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

### Wallet
- `GET /wallet/balance` - Get wallet balance
- `POST /wallet/send` - Send tokens
- `GET /wallet/transactions` - Get transaction history

### Paystack
- `POST /api/paystack/initialize` - Initialize payment
- `POST /api/paystack/verify` - Verify payment

### NullNet
- `GET /api/nullnet/wallets` - Get NullNet wallets
- `POST /api/nullnet/wallets` - Create NullNet wallet
- `GET /api/nullnet/assets` - Get NullNet assets
- `POST /api/nullnet/assets` - Create NullNet asset

## Project Structure

```
├── config/                 # Configuration files
├── controllers/            # Route controllers
├── middlewares/            # Express middlewares
├── models/                 # MongoDB models
├── modules/                # Feature modules (NullNet)
├── routes/                 # API routes
├── services/               # Business logic services
├── utils/                  # Utility functions
├── index.js               # Main application file
├── vercel.json            # Vercel configuration
└── package.json           # Dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check your `MONGO_URI` environment variable

2. **CORS Errors:**
   - Update `FRONTEND_URL` in your environment variables
   - Check that your frontend URL is correct

3. **Vercel Deployment Issues:**
   - Ensure all environment variables are set in Vercel
   - Check that `vercel.json` is in the root directory
   - Verify that `index.js` exports the Express app

4. **Missing Dependencies:**
   - Run `npm install` to install all dependencies
   - Check that all required packages are in `package.json`

## Support

For issues and questions, please check the project documentation or create an issue in the repository. 