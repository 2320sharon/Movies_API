//Required to prove validation of JS objects.
const joi = require("joi");
//Used to make GET, POST, PUT, DELETE requests
const express = require("express");
//Represents application has GET, POST, PUT, DELETE
const app = express();
//Needed to access mysql database
const mysql = require("mysql");
//Needed to gather data from the OMDB API
const axios = require("axios");
//The following imports grab the functions from the util file
const CreateUrl = require("./util").CreateUrl;
//location at the same current level.
const Create_IMDB_URL = require("./util").Create_IMDB_URL;
//config is used to link the javaspcipt code to the database
const config = {
  host: "localhost",
  user: "root",
  database: "moviesdata1",
  password: "sqlDoggo99",
};
//Port is dynamically asssigned. Enviromental variable is port otherwise assign to Port 3000.
const port = process.env.PORT || 3000;
//sql will be a string that holds the command to query the database
let sql = ``;
//param for the paramter for sql query
let param = [];
//params are the paramters for sql query
let params = [];
//Sends a message in terminal to verify server is running
var server = app.listen(port, () =>
  console.log(`Listening on port ${port}...`)
);
//class database is the class used to send queries over to the database
class Database {
  //constructs the connection to the database using constant config
  constructor(config) {
    this.connection = mysql.createConnection(config);
  }
  //query is used for making queries to send out to the database
  query(sql, args) {
    return new Promise((resolve, reject) => {
      this.connection.query(sql, args, (err, rows) => {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      });
    });
  }
  //closes the database
  close() {
    return new Promise((resolve, reject) => {
      this.connection.end((err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }
}

app.use(express.json());

/*
 * async function GetRequest(url)
 * precondition: none
 * postconditions: Returns a json object that contains the year,title, and awards info for the movie
 * @param{var} url created by function CreateUrl(name)
 * @return {var} jsonobject jsonobject of the movie in question
 */
async function GetRequest(url) {
  //Should wait until data is returned by the get request.
  const runtimeinfo = await axios
    .get(url)
    .then((response) => {
      return response.data.Runtime;
    })
    .catch(function (error) {
      console.log(error);
    });
  //Should wait until data is returned by the get request.
  const genreinfo = await axios
    .get(url)
    .then((response) => {
      return response.data.Genre;
    })
    .catch(function (error) {
      console.log(error);
    });
  //Should wait until data is returned by the get request.
  const imdbratinginfo = await axios
    .get(url)
    .then((response) => {
      return response.data.imdbRating;
    })
    .catch(function (error) {
      console.log(error);
    });
  //Should wait until data is returned by the get request.
  const imdbIDinfo = await axios
    .get(url)
    .then((response) => {
      return response.data.imdbID;
    })
    .catch(function (error) {
      console.log(error);
    });
  //Creates an object with date and title and award nominations.
  var jsonobject = {
    runtime: runtimeinfo,
    genre: genreinfo,
    imdID: imdbIDinfo,
    imdbrating: imdbratinginfo,
  };
  return jsonobject;
}
/*
 * Function Check_database_title(title)
 * Purpose: Finds the link to the imdb page based on the movie title given by the user.
 * @param{var} title the title of the movie
 * @return {var} title the title of the movie
 * @throw {error} if there is an error
 */
async function Check_database_title(title) {
  //create a variable that holds the connection to the MYSQL database
  const db = mysql.createConnection(config);

  //establish a connection to the database we have created
  db.connect((err) => {
    if (err) {
      throw err;
    } //if an error occurs when connectiong to database throw an error
    console.log("MYSQL connencted!");
  });

  async function get_database_imdb_url() {
    sql = `SELECT imdburl FROM oscar_winner_data_csv WHERE entity = '${title}'`;
    let query = db.query(sql, (error, result) => {
      if (error) {
        throw error;
      }
      if (result.length <= 0) {
        console.log("ERROR: NOT VALID MOVIE TITLE.");
      } else {
        //if null then fill coulumns with null
        if (result[0].imdburl == null) {
          var url = CreateUrl(title);
          //1. make the omdb call
          GetRequest(url)
            .then((result) => {
              //3. Put the result into an UPDATE query for the matching entity update the imdbID,genre,imdbrating, and the runtime.
              sql = `UPDATE oscar_winner_data_csv SET runtime = '${result.runtime}',  genre = '${result.genre}', imdbID = '${result.imdID}', imdbRating = '${result.imdbrating}' WHERE entity =  '${title}'`;
              db.query(sql, (error, result) => {
                if (error) {
                  throw error;
                }
              });
              return title; // return the title to be used in the following query
            })
            .then((title) => {
              //Now the database contains the updated runtime, genre, imdbID, and imdbRating for the specific movie title.
              //Now search the movie's imdbID based on the title provided by the user. (WE updated the data in the row so we have to do another query)
              //Check if the url column contains a url.
              sql = `SELECT imdbID FROM oscar_winner_data_csv WHERE entity = '${title}' `;
              let query = db.query(sql, (error, result) => {
                if (error) {
                  throw error;
                }
                var imdbID_middle = result[0].imdbID;
                var imdb_URL = Create_IMDB_URL(imdbID_middle);
                sql = `UPDATE oscar_winner_data_csv SET imdburl = '${imdb_URL}' WHERE imdbID =  '${imdbID_middle}'`;
                db.query(sql, (error, result) => {
                  if (error) {
                    throw error;
                  }
                  console.log(`IMDB URL :  ${imdb_URL}`);
                });
              });
            });
        } else {
          var imdb_URL = result[0].imdburl;
          console.log("\nIMDB URL : " + imdb_URL);
        }
      }
    });
  }
  get_database_imdb_url();
}

//Calls Check_database_title() to get the IMDB url and extra information about a given movie title
Check_database_title("Army Girl");

/*********************************************************/
/*              ALL POST FUNCTIONS                       */
/*********************************************************/
/*
 * app.post('/api/database/movie/post',(req, res) => POST request
 * preconditions: must be connected to database
 * postconditions: posted a movie with all its data into the mysl database
 * purpose: POST Request used to insert a movie created by user can only post if movie is a winner
 * @param {root} root of the directory where the movies are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.post("/api/database/movie/post", (req, res) => {
  database = new Database(config);
  params = [
    req.body.year,
    `${req.body.category}`,
    `${req.body.winner}`,
    `${req.body.entity}`,
  ];
  sql = `INSERT INTO oscar_winner_data_csv (year, category, winner, entity) VALUES(?,?,?,?)`;
  database.query(sql, params).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/******************************************************/
/*              ALL PUT FUNCTIONS                     */
/******************************************************/
/*
 * app.put('/api/database/movie/put',(req, res) => PUT Request
 * preconditions: must be connected to database
 * postconditions: send the new data out to postman
 * purpose: searchs for the matching entry in the database based on entity
 * @param {root} root of the directory where the movies are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.put("/api/database/movie/put", (req, res) => {
  database = new Database(config);
  params = [
    req.body.year,
    `${req.body.category}`,
    `${req.body.winner}`,
    `${req.body.entity}`,
  ];
  sql = `UPDATE oscar_winner_data_csv SET year = ?, category = ?, winner = ? WHERE entity = ?`;
  database.query(sql, params).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/*******************************************************/
/*             ALL DELETE FUNCTIONS                    */
/*******************************************************/
/*
 * app.delete('/api/database/movie/delete',(req, res) => DELETE Request
 * preconditions: must be connected to database
 * postconditions: send the deleted movie out to postman
 * purpose: searchs for the matching entry in the database based on entity and deletes the rows Collection endpoint
 * @param {root} root of the directory where the movies are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.delete("/api/database/movie/delete", (req, res) => {
  database = new Database(config);
  params = [
    req.body.year,
    `${req.body.category}`,
    `${req.body.winner}`,
    `${req.body.entity}`,
  ];
  sql = `DELETE FROM oscar_winner_data_csv  WHERE year = ? AND category = ? AND winner = ? AND entity = ? LIMIT 1`;
  database.query(sql, params).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/*
 * app.delete('/api/database/movie/delete',(req, res) => DELETE Request
 * preconditions: must be connected to database
 * postconditions: send the deleted movie out to postman
 * purpose: searchs for the matching entry in the database based on entity and deletes the rows Singleton endpoint
 * @param {root} root of the directory where the movies are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.delete("/api/database/movie/delete", (req, res) => {
  database = new Database(config);
  params = [`${req.body.entity}`];
  sql = `DELETE FROM oscar_winner_data_csv  WHERE entity = ? LIMIT 1`;
  database.query(sql, params).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/*
 * app.delete('/api/database/movie/delete',(req, res) => DELETE Request
 * preconditions: must be connected to database
 * postconditions: send the deleted movie out to postman
 * purpose: searchs for the matching entry in the database based on entity and deletes the rows Singleton endpoint
 * please note: Remeber collection delete request can delete rows of data it can endanger the database. Not for user use.
 * @param {root} root of the directory where the movies are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.delete("/api/database/movies/delete", (req, res) => {
  database = new Database(config);
  params = [
    req.body.year,
    `${req.body.category}`,
    `${req.body.winner}`,
    `${req.body.entity}`,
  ];
  sql = `DELETE FROM oscar_winner_data_csv  WHERE year = ? AND category = ? AND winner = ? AND entity = ? `;
  database.query(sql, params).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/****************************************************/
/*             ALL OF THE GET FUNCTIONS             */
/****************************************************/
/*
 * app.get('/api/database/movies',(req,res) => GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for movies
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movies", (req, res) => {
  database = new Database(config);
  sql = `SELECT * FROM oscar_winner_data_csv`;
  database.query(sql).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/*
 * app.get('/api/database/movie/year/:year',(req, res) => GET request
 * preconditions: has to be connected to mysql database
 * postconditions: send the result into postman
 * purpose: singleton endpoint for year
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to request data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movie/year/:year", (req, res) => {
  database = new Database(config);
  param = [req.params.year];
  sql = `SELECT * FROM oscar_winner_data_csv WHERE year = ? LIMIT 0,1 `; //` this is the symbol under the ~
  database.query(sql, param).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
    res.end();
  });
});
/*
 * app.get('/api/database/movies/years/:year',(req, res) => GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for year
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movies/years/:year", (req, res) => {
  database = new Database(config);
  param = [req.params.year];
  sql = `SELECT * FROM oscar_winner_data_csv WHERE year = ?`;
  database.query(sql, param).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/*
 * app.get('/api/database/movie/category/:category',(req,res)=>GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: singleton enpoint for category
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movie/category/:category", (req, res) => {
  database = new Database(config);
  param = [`${req.params.category}`];
  sql = `SELECT * FROM oscar_winner_data_csv WHERE category =  ? LIMIT 1`; //Grabs 1 matching category.
  database.query(sql, param).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
    res.end();
  });
});
/*
 * app.get('/api/database/movies/categories/:category',(req,res)=>GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for category
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movies/categories/:category", (req, res) => {
  database = new Database(config);
  param = [`${req.params.category}`];
  sql = `SELECT * FROM oscar_winner_data_csv WHERE category = ?`; //Grabs all the matching categories.
  database.query(sql, param).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
    res.end();
  });
});
/*
 * app.get('/api/database/movie/winner/:winner',(req, res) => GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: singleton enpoint for winners
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movie/winner/:winner", (req, res) => {
  database = new Database(config);
  param = [`${req.params.winner}`];
  sql = `SELECT * FROM oscar_winner_data_csv WHERE winner = ?  LIMIT 1`; //Grabs 1 matching winner.
  database.query(sql, param).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/*
 * app.get('/api/database/movies/winners/:winner' => GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for winners
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movies/winners/:winner", (req, res) => {
  database = new Database(config);
  param = [`${req.params.winner}`]; //User can only provide the year,the category,the name of the entity, whether an award is won.
  sql = `SELECT * FROM oscar_winner_data_csv WHERE winner = ?`; //Grabs all the matching winners.
  database.query(sql, param).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/*
 * app.get('/api/database/movie/entity/:entity',(req,res)=> GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: singleton enpoint entities
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movie/entity/:entity", (req, res) => {
  database = new Database(config);
  param = [`${req.params.entity}`];
  sql = `SELECT * FROM oscar_winner_data_csv WHERE entity = ? LIMIT 1`; //Grabs 1 matching entity
  database.query(sql, param).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
    res.end();
  });
});

/*
 * app.get('/api/database/movies/entities/:entity',(req,res)=> GET request
 * precondintion: has to be connected to mysql
 * postconditions: sends the result of the get into postman
 * purpose: collection endpoint for entities. User can only provide the year,the category,the name of the entity, whether an award is won.
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to reuest data
 * @param {res} respond paraamter from express to send data
 */
app.get("/api/database/movies/entities/:entity", (req, res) => {
  database = new Database(config);
  let params = [`${req.params.entity}`];
  let sql = `SELECT * FROM oscar_winner_data_csv WHERE entity = ?`; //Grabs all the matching entities
  database.query(sql, params).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
/*
 * app.get('/api/database/movie/years/:year1/:year2',(req, res) => GET request
 * preconditions: has to be connected to mysql database
 * postconditions: send the result into postman
 * purpose: gets a range of different years as a request
 * @param {root} root of the directory where the years are stored.
 * @param {req} request paramater from express to request data
 * @param {res} respond paraamter from express to send data
 * @throws {error} if there is an error, throws error
 */
app.get("/api/database/movies/years/:year1/:year2", (req, res) => {
  database = new Database(config);
  params = [req.params.year1, req.params.year2];
  sql = `SELECT * FROM oscar_winner_data_csv WHERE year BETWEEN ? AND ? ORDER BY year ASC, entity ASC;`;
  database.query(sql, params).then((result) => {
    console.log(result);
    res.send(result);
    database.close();
  });
});
