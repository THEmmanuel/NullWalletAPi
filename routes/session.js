const express = require('express');
const router = express.Router();
const sessionController = require('../../controllers/sessionController');
const auth = require('../../middlewares/authMiddleware');

router.post('/start', auth, sessionController.startSession);  // start with Kinetic Key
router.post('/update', auth, sessionController.updateSession); // e.g., selected chain, tokens
router.get('/current', auth, sessionController.getSession);   // retrieve current session data
router.post('/end', auth, sessionController.endSession);      // clean up

module.exports = router;