const express = require('express');
const instanceController = require('../controllers/instance.controller');
const router = express.Router();

router.get('/qr', instanceController.createQr);
router.post('/save', instanceController.saveInstance);
router.post('/instanceLogin', instanceController.loginInstance);

module.exports = router;