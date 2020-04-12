const express = require('express');
const router = express.Router(); // eslint-disable-line
const ImageController = require('./controllers/Image')
const CamController = require('./controllers/Cam')

router.get('/image', ImageController.getImage);
// router.get('/cam/start', CamController.start);
router.get('/cam/*', CamController.executeCommand);

module.exports = router;