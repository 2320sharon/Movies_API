/* util.js
Purpose: Contains the functions   Create_IMDB_URL() and CreateUrl() which are both used to create urls.
They are placed in this file to make app.js (the main program) easier to read and to make unit testing easier.
*/
module.exports = {
  /*function Create_IMDB_URL(imdbID_middle)
    purpose: Creates an imdb url that we can give to user to link the movie's imdb page based on the imdbID in the datbase
    */
  Create_IMDB_URL: function (imdbID_middle) {
    // build a url to link the imdb page
    //   we can turn this into hypertext link the user can see later for the html page
    var imdb_url_start = "https://www.imdb.com/title/";
    var imdb_end_url = "/";
    var imdb_url = imdb_url_start + imdbID_middle + imdb_end_url; //this is the full url to get to the imbd page
    return imdb_url;
  }, //end of Create_IMDB_URL(imdbid)

  /*function CreateUrl(name)
    purpose: Creates an omdb url that enables axios to make a call to the OMDB API based on the movie name given.
    */
  CreateUrl: function (name) {
    //variables to search omdb api
    var api = "http://www.omdbapi.com/?";
    var searchtitle = "t=";
    var title = `${name}`; //TITLE WILL BE REPLACED BY TITLE GIVEN BY USER
    var apikey = "&apikey=f6eeadf6"; //this api key is unqiuely assigned and necesssary for the api call
    var url = api + searchtitle + title + apikey;

    return url;
  },
}; //end of exports
