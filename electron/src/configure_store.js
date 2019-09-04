const fs = require('fs');
const path = require('path');
const os = require('os');

const configurePath = path.join(os.homedir(), '.pgadmin', 'configure.json');

var ConfigureStore = {
  filePath: configurePath,
  jsonData: {},
  isInit: false,

  init: function(filePath) {
    if(filePath) {
      this.filePath = filePath;
    }
    try {
      this.jsonData = JSON.parse(fs.readFileSync(this.filePath));  
    } catch (error) {
      /* If the file is not present or invalid JSON data in file */
      this.jsonData = {};
    }
    this.isInit = true;

    return this;
  },

  isInitCheck() {
    if(!this.isInit) {
      throw 'ConfigureStore not initialized';
    }
  },

  getConfigFilePath() {
    return this.filePath;
  },

  save: function() {
    this.isInitCheck();
    fs.writeFileSync(this.filePath, JSON.stringify(this.jsonData, null, 4), {flag: 'w'});
  },

  get_data_json: function() {
    return this.jsonData;
  },

  get: function(key, if_not_value) {
    this.isInitCheck();
    if(this.jsonData[key] != undefined) {
      return this.jsonData[key];
    } else {
      return if_not_value;
    }
  },

  set: function(key, value) {
    this.isInitCheck();

    if(typeof key === 'object'){
      this.jsonData = {
        ...this.jsonData,
        ...key,
      };
    } else {
      if(value === '' || value == null || typeof(value) == 'undefined') {
        if(this.jsonData[key] != undefined) {
          delete this.jsonData[key];
        }
      } else {
        this.jsonData[key] = value;
      }
    }
  },

  keys: function() {
    return Object.keys(this.jsonData);
  },
};

module.exports = {
  ConfigureStore: ConfigureStore,
};