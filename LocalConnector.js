const fs = require('fs')
const moment = require('moment')

const PHOTOS_DIR = '/home/pi/photos'

class LocalConnector {
  constructor(tracer) {
    this.tracer = tracer
  }

  async createDailyDir(config) {
    return new Promise((resolve, reject) => {
      this._createDir(PHOTOS_DIR)
      const directory = `${PHOTOS_DIR}/${config.folderName}_${moment().format('YYYYMMDD')}`
      this._createDir(directory)
      resolve(directory)
    })
  }

  deleteFile(fileName) {
    this.tracer.log(`Deleting file ${fileName}`)
    fs.unlinkSync(fileName)
  }

  deleteDir(dirName) {
    this.tracer.log(`Deleting dir ${dirName}`)
    fs.rmdirSync(dirName)
  }

  get photos_dir() {
    return PHOTOS_DIR
  }

  _createDir(dir) {
    try {
      fs.mkdirSync(dir);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
  }
}


module.exports = LocalConnector