const rp = require('request-promise');
const request = require('request')
const fs = require('fs')
const moment = require('moment')

const CAMERA_IP = "http://192.168.168.1"

class CamConnector {
  constructor(tracer) {
    this.tracer = tracer
  }

  async downloadFile(fileName, raw, localDir) {
    this.tracer.log(`Downloading file: ${fileName}`)
    const currentDate = moment()
    const file = `${localDir}/${currentDate.format('YYYYMMDDHHmm')}`
    const extension = fileName.substring(fileName.length-3)
    const localFileName = `${file}.${extension}`
    await this._download(fileName, localFileName)

    if (raw) {
      const dngFileName = fileName.replace(`.${extension}`, '.DNG')
      this.tracer.log(`Downloading raw file: ${dngFileName}`)
      const dngLocalFileName = `${file}.DNG`
      await this._download(dngFileName, dngLocalFileName)
    }

    return localFileName
  }

  async _download(fileName, localPath) {
    const url = `${CAMERA_IP}${fileName}`
    return new Promise((resolve, reject) => {
      try {
        request(url).pipe(fs.createWriteStream(localPath)).on('close', resolve)
      } catch (err) {
        reject(err)
      }
    })
  }

  async deleteFile(fileName, raw) {
    const extension = fileName.substring(fileName.length-3)
    const localFileName = `${fileName}.${extension}`
    this.tracer.log(`Deleting camera file: ${fileName}`)
    await this._deleteFile(fileName)
    return
  }

  async _deleteFile(fileName) {
    const url = `${CAMERA_IP}${fileName}?act=rm`
    return rp(url)
  }

  async takePhoto() {
    this.tracer.log('Taking photo')
    const response = await rp({uri: `${CAMERA_IP}/ctrl/still?action=cap`, json: true})
    if (!response.msg) {
      throw new Error('Photo not taken')
    }
    return response.msg
  }

}

module.exports = CamConnector
