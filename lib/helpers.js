/*
 * Helpers for various tasks
 *
 */

// Dependencies

// Container for all the helpers
const helpers = {};

// Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = str => {
  try{
    const obj = JSON.parse(str);
    return obj;
  } catch(e){
    return {};
  }
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength => {
  strLength = typeof strLength == 'number' && strLength > 0 ? strLength : false;
  if(strLength){
    // Define all the possible characters that could go into a string
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // Start the final string
    let str = '';

    for(let i = 1; i <= strLength; i++) {
        // Get a random charactert from the possibleCharacters string
        const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
        // Append this character to the string
        str += randomCharacter;
    }
    // Return the final string
    return str;
  } else {
    return false;
  }
};

// Export the module
module.exports = helpers;
