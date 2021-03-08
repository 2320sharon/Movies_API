/*Program: UTIL.TEST.JS
Purpose: Used to hold unit tests for CreateUrl() and Create_IMDB_URL (). Puts a dummy variable inside and checks
if the url is still functional.
TO RUN A UNIT TEST DO THE FOLLOWING:
1.In terminal run:  NPM i mocha chai --save-dev          //this saves them as developer dependenies in the package.json
2. Modify the package.json script variable to look like:
 "scripts": {
    "test": "mocha"
  }
  This will allow you to use npm run test later.
3.In terminal run: npm run test
This will run your unit tests
**further notes in the documenation file UnitTestDocumentationandGuide.txt
*/
const assert = require("chai").assert; //chai is needed for assert function library
const CreateUrl = require("../util").CreateUrl; // the ../ means look for util in a different directory one above current level
const Create_IMDB_URL = require("../util").Create_IMDB_URL;

describe("Testing App", function () {
  it("Testing CreateUrl() with dummy data.", () => {
    let result = CreateUrl("dummy");
    assert.equal(result, "http://www.omdbapi.com/?t=dummy&apikey=f6eeadf6");
  });

  it("Testing Create_IMDB_URL () with dummy data.", () => {
    let result = Create_IMDB_URL("dummy");
    assert.equal(result, "https://www.imdb.com/title/dummy/");
  });
});
