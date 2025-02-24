const express = require('express');
const eventController = require('../controllers/event.controller');
const contactController = require('../controllers/contacts.controller');
const { authenticateInstance } = require('../middlewares/auth')
const router = express.Router();
const upload = require('../middlewares/multer');
const uploadController = require('../controllers/file.controller')

router.post('/event', eventController.handleEvent);

router.get('/getContacts', authenticateInstance, contactController.getContact);
router.post('/updateContact/:id', authenticateInstance, contactController.updateContacts);
router.post('/saveContact', authenticateInstance, contactController.saveContact);
router.delete('/deleteContact/:id', authenticateInstance, contactController.deleteContact);

router.post('/getMessages', authenticateInstance, contactController.getMessages);

router.post('/sendMessage', authenticateInstance, contactController.sendMessage);

router.post('/markMessagesAsRead', authenticateInstance, contactController.markMessagesAsRead);

router.post('/upload-chunk', upload.single('chunk'), uploadController.uploadChunk);
router.post('/merge-chunks', uploadController.mergeChunks);

// router.post('/sendBulkMessage', contactController.sendBulkMessage);


module.exports = router;