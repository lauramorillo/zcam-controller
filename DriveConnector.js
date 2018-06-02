const readline = require('readline');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const fs = require('fs');
const drive = google.drive('v3');
const path = require('path')

const ROOT_FOLDER = '1PH3R00t7fO4wQsjYqLmwYQcS-voCE6yd'
const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_DIR = '/home/pi/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'drive-nodejs-quickstart.json';
const SECRET = '/home/pi/project/client_secret.json'

class DriveConnector {
  constructor(tracer, localConnector) {
    this.tracer = tracer
    this.localConnector = localConnector
  }

  async getConfigFile(fileName) {
    this.tracer.log(`Getting config file ${fileName}`)
    const auth = await this._getAuth()
    return new Promise((resolve, reject) => {  
      this.findFiles( `name='${fileName}'`)
        .then(files => {
          var fileId = files[0].id
          drive.files.get({
            auth: auth,
            fileId: fileId,
            alt: 'media'
          }, function(err, response) {
            if (err) {
              reject(err)
              return;
            }
            resolve(response.data)
          })
        })
    })
  }

  async findFiles(query) {
    const auth = await this._getAuth()
    return new Promise((resolve, reject) => {
      drive.files.list({
        auth: auth,
        q: query
      }, function(err, response) {
        if (err) {
          reject(err)
          return
        }
        resolve(response.data.files)
      })
    })
  }

  async uploadFiles(localDir) {
    const readFolders = fs.readdirSync(localDir)
    for (let i = 0; i < readFolders.length; i++ ) {
      const file = readFolders[i]
      const fullPath = path.join(localDir, file)
      if (fs.lstatSync(fullPath).isDirectory()) {
        const folderId = await this._getOrCreateFolder(file)
        const files = fs.readdirSync(fullPath)
        for (let j = 0; j < files.length; j++ ) {
          const fileToUpload = path.join(fullPath, files[j])
          await this._uploadFile(fileToUpload, folderId, files[j])
          this.tracer.log('File uploaded')
          this.localConnector.deleteFile(fileToUpload)
        }
        this.localConnector.deleteDir(fullPath)
      }
    }
    Promise.resolve()
  }

  async uploadDailyFile(file, config) {
    const folderId = await this._getOrCreateFolder('daily')
    await this._uploadFile(file, folderId, `${config.folderName}_${file.substring(file.lastIndexOf('/') + 1)}`)
    this.localConnector.deleteFile(file)
  }

  async _uploadFile(localDir, parentFolder, fileName) {
    this.tracer.log(`Uploading file ${localDir} to ${parentFolder}`)
    const auth = await this._getAuth()
    return new Promise((resolve, reject) => {
      var fileMetadata = {
        name: fileName,
        parents: [parentFolder]
      };
      var media = {
        body: fs.createReadStream(localDir)
      };
      drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id',
        auth: auth
      }, function (err, file) {
        if (err) {
          reject(err)
          return
        }
        resolve()
      });
    })
  }

  async _getOrCreateFolder(folderName) {
    const auth = await this._getAuth()
    const folder = await this.findFiles(`name='${folderName}'`)
    if (folder.length > 0) {
      this.tracer.log(`Folder ${folderName} exists`)
      return Promise.resolve(folder[0].id)
    }
    var fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [ROOT_FOLDER]
    };
    this.tracer.log(`Parent folder found: ${ROOT_FOLDER}`)
    return new Promise((resolve, reject) => {
      drive.files.create({
        resource: fileMetadata,
        fields: 'id',
        auth: auth
      }, function (err, file) {
        if (err) {
          reject(err)
          return
        }
        resolve(file.data.id)
      });
    })
  }

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {function} callback The callback to call with the authorized client.
   */
  authorize() {
    this.tracer.log('Authorizing...')
    return new Promise((resolve, reject) => {
      return this.loadCredentialsFile().then(credentials => {
        var clientSecret = credentials.installed.client_secret;
        var clientId = credentials.installed.client_id;
        var redirectUrl = credentials.installed.redirect_uris[0];
        var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
          if (err) {
            this.tracer.log('Generating new token')
            this.getNewToken(oauth2Client).then(auth => {
              resolve(auth)
            });
          } else {
            this.tracer.log('Using previous token')
            oauth2Client.credentials = JSON.parse(token);
            resolve(oauth2Client)
          }
        });
      })
    }).then(auth => this._auth = auth)
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  getNewToken(oauth2Client, callback) {
    return new Promise((resolve, reject) => {
      var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
      });
      console.log(`Authorize this app by visiting this url: ${authUrl}`);
      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oauth2Client.getToken(code, (err, token) => {
          if (err) {
            this.tracer.error(`Error while trying to retrieve access token: ${err}`);
            reject(err);
          }
          oauth2Client.credentials = token;
          this.storeToken(token);
          resolve(oauth2Client);
        });
      });
    })
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    this.tracer.log(`Token stored to ${TOKEN_PATH}`);
  }

  loadCredentialsFile() {
    return new Promise((resolve, reject) => {
      fs.readFile(SECRET, (err, content) => {
        if (err) {
          this.tracer.error(`Error loading client secret file: ${err}`);
          reject(err)
          return;
        }
        resolve(JSON.parse(content));
      });
    })
  }

  async _getAuth() {
    if (!this._auth) {
      return this.authorize()
    }
    return Promise.resolve(this._auth)
  }
}

module.exports = DriveConnector
