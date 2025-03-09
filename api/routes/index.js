// routes/index.js
const express = require('express');
// const userRoutes = require('./user.routes');
// const authRoutes = require('./auth.routes')
// const cmsRoutes = require('./cms.routes');
// const instanceRoutes = require('./instance.routes');
// const fileRoutes = require('./file.routes')
// const campaignRoutes  =require('./campaign.routes')
// const eventRoutes = require('./event.routes')
const chatsRoutes = require('./chats.routes')
const qrRoutes = require('./qr.routes')
const listRoutes = require('./lists.routes')
const userRoutes = require('./user.routes')

const router = express.Router();

router.use('/chats', chatsRoutes);
router.use('/instance', qrRoutes);
router.use('/list', listRoutes);
router.use('/user', userRoutes)

module.exports = router;
