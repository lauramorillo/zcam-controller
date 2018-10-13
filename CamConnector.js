const rp = require('request-promise');
const request = require('request')
const fs = require('fs')
const moment = require('moment')
var Gpio = require('onoff').Gpio;

const PIN = 4
const CAMERA_IP = 'http://192.168.168.1'
const SWITCH = new Gpio(PIN, 'out');

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

  executeCommand(path, query) {
    this.tracer.log(`Executing command: ${ path } with params, ${ JSON.stringify(query) }`)
    const url = `${CAMERA_IP}${path}`
    return rp(url, { json: true, qs: query })
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

  _deleteFile(fileName) {
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

  start() {
    SWITCH.writeSync(1);
    setTimeout(() => { SWITCH.writeSync(0) }, 2000);
  }

}

module.exports = CamConnector
