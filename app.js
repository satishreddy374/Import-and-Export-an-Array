const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });

    app.listen(3008, () => {
      console.log("Server is running at http://localhost:3008/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const getMovieNames = (movieObj) => {
  return {
    movieName: movieObj.movie_name,
  };
};

//GET get all the movies list from movie table API

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
  SELECT 
  movie_name
  FROM movie;
    `;

  const moviesArray = await db.all(getMoviesQuery);
  response.send(moviesArray.map((each_movie) => getMovieNames(each_movie)));
});

//POST Adds a new movie to the movie table API

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;

  const addMovieQuery = `INSERT INTO 
        movie(director_id,movie_name,lead_actor)
        VALUES(${directorId}, ${movieName}, ${leadActor}) `;

  const dbResponse = await db.run(addMovieQuery);

  response.send("Movie Successfully Added");
});

const convertDbObjectToResponseObject = (dbObj) => {
  return {
    movieId: dbObj.movie_id,
    directorId: dbObj.director_id,
    movieName: dbObj.movie_name,
    leadActor: dbObj.lead_actor,
  };
};

//GET returns a movie based on movie_id

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `SELECT *
        FROM movie
        WHERE movie_id = ${movieId}`;

  const movie = await db.get(getMovieQuery);
  console.log(movieId);
  response.send(convertDbObjectToResponseObject(movie));
});

//PUT update the movie details based on movie_id

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;

  const { directorId, movieName, leadActor } = movieDetails;

  const updateMovieQuery = `UPDATE movie
        SET 

        director_id = ${directorId},
        movie_name = ${movieName},
        lead_actor = ${leadActor}

        WHERE movie_id = ${movieId};
        `;
  await db.run(updateMovieQuery);

  response.send("Movie Details Updated");
});

//DELETE deleted a movie from a movie table based on movie_id

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const deleteMovieQuery = `DELETE FROM movie
        WHERE movie_id = ${movieId}`;

  await db.run(deleteMovieQuery);

  response.send("Movie Removed");
});

const convertDirectorDetailsToPascalCase = (dbObj) => {
  return {
    directorId: dbObj.director_id,
    directorName: dbObj.director_name,
  };
};

//GET get all the director names list

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `SELECT *
        FROM director`;

  const moviesArray = await db.all(getDirectorsQuery);
  response.send(
    moviesArray.map((director) => convertDirectorDetailsToPascalCase(director))
  );
});

const convertMovieNameToPascalCase = (dbObj) => {
  return {
    movieName: dbObj.movie_name,
  };
};

//GET returns a list of movie names directed by specific director

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;

  const directorMovieNamesQuery = `SELECT movie_name
        FROM director INNER JOIN movie
        ON director.director_id = movie.director_id
        WHERE director.director_id = ${directorId}`;

  const directorMoviesArray = await db.all(directorMovieNamesQuery);
  console.log(directorId);
  response.send(
    directorMoviesArray.map((movieNames) =>
      convertMovieNameToPascalCase(movieNames)
    )
  );
});

module.exports = app;
