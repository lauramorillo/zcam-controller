const express = require('express');
const router = express.Router(); // eslint-disable-line
const DriveConnector = require('./DriveConnector')
const CamConnector = require('./CamConnector')
const LocalConnector = require('./LocalConnector')
const Config = require('./Config')
const path = require('path')
const Tracer = require('./Tracer')

const tracer = new Tracer()
const localConnector = new LocalConnector(tracer)
const driveConnector = new DriveConnector(tracer, localConnector)
const camConnector = new CamConnector(tracer)


async function getImagePath() {
  const config = await Config.getConfig(driveConnector)
  const localDir = await localConnector.createDailyDir(config)
  const pictureCameraPath = await camConnector.takePhoto()
  const localFilePath = await camConnector.downloadFile(pictureCameraPath, false, localDir)
  await camConnector.deleteFile(pictureCameraPath)
  return localFilePath
}

router.get('/image', (req, res, next) => {
  getImagePath().then(filePath => {
    tracer.log(`Downloading: ${filePath}`)
    res.sendFile(filePath, (err) => {
      localConnector.deleteFile(filePath)
    })
  }).catch(err => {
    tracer.error(err)
    res.sendStatus(500);
  })
});

module.exports = router;