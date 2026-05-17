const fs = require('node:fs');
const path = require('node:path');

const moviesFile = path.join(__dirname, 'movies.json');
let movies = JSON.parse(fs.readFileSync(moviesFile, 'utf8'));

function saveMovies() {
  fs.writeFileSync(moviesFile, JSON.stringify(movies, null, 2), 'utf8');
}

function getUserMovies(username) {
  return movies[username] || {};
}

function getUserMovie(username, imdbID) {
  const userMovies = getUserMovies(username);
  return userMovies[imdbID];
}

function hasUserMovie(username, imdbID) {
  return getUserMovie(username, imdbID) !== undefined;
}

function setUserMovie(username, imdbID, movie) {
  if (!movies[username]) {
    movies[username] = {};
  }
  const exists = imdbID in movies[username];
  movies[username][imdbID] = movie;
  saveMovies();
  return exists;
}

function deleteUserMovie(username, imdbID) {
  if (!movies[username] || !(imdbID in movies[username])) {
    return false;
  }
  delete movies[username][imdbID];
  saveMovies();
  return true;
}

function getGenres(username) {
  return [...new Set(Object.values(getUserMovies(username)).flatMap((movie) => movie.Genres || []))];
}

module.exports = {
  getUserMovies,
  getUserMovie,
  hasUserMovie,
  setUserMovie,
  deleteUserMovie,
  getGenres,
};
