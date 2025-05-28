const express = require('express');
const router = express.Router();
const AssetX = require('../../models/AssetX');
const Transaction = require('../../models/NullWalletTransaction');


const {
	BuyAsset
} = require('../../utils/AssetX');

const {
	SendAsset
} = require('../../utils/AssetX');



// Create new asset
router.post('/', async (req, res) => {
	const {
		assetName,
		assetSymbol,
		assetPrice
	} = req.body;

	if (!assetName || !assetSymbol || assetPrice === undefined) {
		return res.status(400).json({
			error: 'All fields are required.'
		});
	}

	try {
		const newAsset = new AssetX({
			assetName,
			assetSymbol,
			assetPrice
		});
		await newAsset.save();
		res.status(201).json(newAsset);
	} catch (err) {
		res.status(500).json({
			error: err.message
		});
	}
});

// Update an asset
router.put('/:id', async (req, res) => {
	try {
		const updatedAsset = await AssetX.findByIdAndUpdate(req.params.id, req.body, {
			new: true
		});

		if (!updatedAsset) {
			return res.status(404).json({
				error: 'Asset not found.'
			});
		}

		res.json(updatedAsset);
	} catch (err) {
		res.status(500).json({
			error: err.message
		});
	}
});

// Get all assets
router.get('/', async (req, res) => {
	try {
		const assets = await AssetX.find();
		res.json(assets);
	} catch (err) {
		res.status(500).json({
			error: err.message
		});
	}
});

// Get asset by ID
router.get('/:id', async (req, res) => {
	try {
		const asset = await AssetX.findById(req.params.id);

		if (!asset) {
			return res.status(404).json({
				error: 'Asset not found.'
			});
		}

		res.json(asset);
	} catch (err) {
		res.status(500).json({
			error: err.message
		});
	}
});


router.post('/send-asset', async (req, res) => {
	const result = await SendAsset(...Object.values(req.body));
	result.success ? res.json(result) : res.status(400).json(result);
});

router.post('/buy-asset', async (req, res) => {
	const result = await BuyAsset(...Object.values(req.body));
	result.success ? res.json(result) : res.status(400).json(result);
});

router.get('/get-asset-price/:symbol', async (req, res) => {
	try {
		const symbol = req.params.symbol;

		const asset = await AssetX.findOne({
			assetSymbol: {
				$regex: `^${symbol}$`,
				$options: 'i'
			} // case-insensitive exact match
		});

		if (!asset) {
			return res.status(404).json({
				error: 'Asset not found'
			});
		}

		res.json({
			price: asset.assetPrice
		});
	} catch (err) {
		res.status(500).json({
			error: 'Server error'
		});
	}
});




module.exports = router;