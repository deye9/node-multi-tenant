/*
 * Library for storing and editing data
 *
 */

'use strict';

// Dependencies
require('dotenv').config();

const fs = require('fs');

/**
 * Class for handling all operations surrounding the file system
 */
class files {

  /**
   * Class constructor
   * @param {String} tenantPath 
   */
  constructor() {
    // Base directory as set in the env file
    this.tenantPath = process.env.TENANT_PATH;
  }

  // Write data to a file
  async create(file, data, callback) {
    // Open the file for writing
    fs.open(this.tenantPath + '/' + file + '.json', 'wx', (err, fileDescriptor) => {

      if (!err && fileDescriptor) {
        
        // Convert data to string
        const stringData = JSON.stringify(data);

        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if (!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
                callback(false);
              } else {
                callback('Error closing new file');
              }
            });
          } else {
            callback('Error writing to new file');
          }
        });
      } else {
        callback('Could not create new file, it may already exist');
      }
    });

  };

  // Read data from a file
  static read(file) {
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, data) => {
        if (!err && data) {
          resolve(data);
        } else {
          reject(err);
        }
      });
    })
  };

  // Update data in a file
  async update(file, data, callback) {

    // Open the file for writing
    fs.open(this.tenantPath + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
      if (!err && fileDescriptor) {
        // Convert data to string
        const stringData = JSON.stringify(data);

        // Truncate the file
        fs.truncate(fileDescriptor, (err) => {
          if (!err) {
            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if (!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                    callback(false);
                  } else {
                    callback('Error closing existing file');
                  }
                });
              } else {
                callback('Error writing to existing file');
              }
            });
          } else {
            callback('Error truncating file');
          }
        });
      } else {
        callback('Could not open file for updating, it may not exist yet');
      }
    });

  };

  // Delete a file
  async delete(file, callback) {

    // Unlink the file from the filesystem
    fs.unlink(this.tenantPath + '/' + file + '.json', (err) => {
      callback(err);
    });

  };

  static readconfig() {
    return require(process.env.TENANT_PATH + '/' + 'tenancy.js');
  }
}

// Export the module
module.exports = { files };