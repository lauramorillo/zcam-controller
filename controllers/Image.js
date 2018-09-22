const Tracer = require('../Tracer')
const Config = require('../Config')
const DriveConnector = require('../DriveConnector')
const CamConnector = require('../CamConnector')
const LocalConnector = require('../LocalConnector')


const tracer = new Tracer()
const localConnector = new LocalConnector(tracer)
const driveConnector = new DriveConnector(tracer, localConnector)
const camConnector = new CamConnector(tracer)

class ImageController {
  static getImage(req, res, next) {
    ImageController.getImagePath().then(filePath => {
      tracer.log(`Downloading: ${filePath}`)
      res.sendFile(filePath, (err) => {
        localConnector.deleteFile(filePath)
      })
    }).catch(err => {
      tracer.error(err)
      res.sendStatus(500);
    })
  }

  static async getImagePath() {
    const config = await Config.getConfig(driveConnector)
    const localDir = await localConnector.createDailyDir(config)
    const pictureCameraPath = await camConnector.takePhoto()
    const localFilePath = await camConnector.downloadFile(pictureCameraPath, false, localDir)
    await camConnector.deleteFile(pictureCameraPath)
    return localFilePath
  }
  
}

module.exports = ImageController
