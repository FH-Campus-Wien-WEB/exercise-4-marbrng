import { ButtonBuilder, ElementBuilder, MovieBuilder } from "./builders.js";

const messages = {
  dataLoadError: "Daten konnten nicht geladen werden, Status",
  movieAlreadyInCollection: "Film bereits in der Sammlung.",
  addMovieFailed: "Hinzufuegen des Films ist fehlgeschlagen.",
  deleteMovieFailed: "Film konnte nicht geloescht werden.",
  emptySearch: "Bitte gib einen Suchbegriff ein.",
  noResultsFound: "Keine Ergebnisse gefunden.",
  searchFailed: "Die Suche ist fehlgeschlagen.",
  loggedOutGreeting: "Bitte logge dich ein, um deine Filmkollektion zu sehen.",
  loginFailed: "Login fehlgeschlagen.",
};

let currentSession = null;

function updateGenres() {
  const header = document.querySelector("nav>h2");
  const listElement = document.querySelector("#filter");

  listElement.innerHTML = "";

  if (!currentSession) {
    header.style.display = "none";
    return;
  }

  fetch("/genres")
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(genres => {
      header.style.display = "block";
      new ElementBuilder("li")
        .append(new ButtonBuilder("All").onclick(() => loadMovies()))
        .appendTo(listElement);

      for (const genre of genres) {
        new ElementBuilder("li")
          .append(new ButtonBuilder(genre).onclick(() => loadMovies(genre)))
          .appendTo(listElement);
      }

      const firstButton = listElement.querySelector("button");
      if (firstButton) {
        firstButton.click();
      }
    })
    .catch(error => {
      console.error("Failed to load genres:", error);
      listElement.append(`${messages.dataLoadError} ${error.message}`);
    });
}

function removeMovies() {
  const mainElement = document.querySelector("main");
  while (mainElement.childElementCount > 0) {
    mainElement.firstChild.remove();
  }
}

function loadMovies(genre) {
  const url = new URL("/movies", location.href);
  if (genre) {
    url.searchParams.set("genre", genre);
  }

  fetch(url)
    .then(response => {
      removeMovies();

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(movies => {
      const mainElement = document.querySelector("main");
      movies.forEach(movie => new MovieBuilder(movie, deleteMovie, Boolean(currentSession)).appendTo(mainElement));
    })
    .catch(error => {
      console.error("Failed to load movies:", error);
      const mainElement = document.querySelector("main");
      mainElement.append(`${messages.dataLoadError} ${error.message}`);
    });
}

function addMovie(imdbID) {
  fetch(`/movies/${imdbID}`, { method: "PUT" })
    .then(response => {
      if (response.status === 201) {
        const searchResult = document.querySelector(`[data-search-result="${imdbID}"]`);
        if (searchResult) {
          searchResult.remove();
        }

        updateGenres();
      } else if (response.status === 200) {
        alert(messages.movieAlreadyInCollection);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .catch(error => {
      console.error("Failed to add movie:", error);
      alert(messages.addMovieFailed);
    });
}

function deleteMovie(imdbID) {
  fetch(`/movies/${imdbID}`, { method: "DELETE" })
    .then(response => {
      if (response.ok) {
        const article = document.getElementById(imdbID) || document.querySelector(`[data-imdb-id="${imdbID}"]`);
        if (article) {
          article.remove();
        }
        updateGenres();
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    })
    .catch(error => {
      console.error("Failed to delete movie:", error);
      alert(messages.deleteMovieFailed);
    });
}

function searchMovies(query) {
  const resultsDiv = document.getElementById("searchResults");
  resultsDiv.innerHTML = "";

  if (!query) {
    new ElementBuilder("p").text(messages.emptySearch).appendTo(resultsDiv);
    return;
  }

  fetch(`/search?query=${encodeURIComponent(query)}`)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(results => {
      resultsDiv.innerHTML = "";

      if (results.length === 0) {
        new ElementBuilder("p").text(messages.noResultsFound).appendTo(resultsDiv);
        return;
      }

      for (const movie of results) {
        const year = movie.Year || "unknown year";
        new ElementBuilder("article")
          .class("search-result")
          .with("data-search-result", movie.imdbID)
          .append(new ElementBuilder("h2").text(movie.Title))
          .append(new ElementBuilder("p").text(year.toString()))
          .append(new ButtonBuilder("Add").onclick(() => addMovie(movie.imdbID)))
          .appendTo(resultsDiv);
      }
    })
    .catch(error => {
      console.error("Search failed:", error);
      resultsDiv.innerHTML = "";
      new ElementBuilder("p").text(messages.searchFailed).appendTo(resultsDiv);
    });
}

window.onload = function () {
  fetch("/session")
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(data => {
      currentSession = data || null;
      updateUI();
    })
    .catch(error => {
      console.error("Failed to load session:", error);
      currentSession = null;
      updateUI();
    });

  function renderUserGreeting() {
    const greetingElement = document.getElementById("userGreeting");
    if (currentSession) {
      const loginDate = new Date(currentSession.loginTime);
      const date = loginDate.toLocaleDateString("de-DE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const time = loginDate.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
      greetingElement.textContent = `Hi ${currentSession.firstName} ${currentSession.lastName}, du hast dich am ${date} um ${time} angemeldet.`;
    } else {
      greetingElement.textContent = messages.loggedOutGreeting;
    }
  }

  function updateUI() {
    const authBtn = document.getElementById("authBtn");
    const addMoviesBtn = document.getElementById("addMoviesBtn");

    renderUserGreeting();
    updateGenres();

    if (currentSession) {
      authBtn.textContent = "Logout";
      authBtn.onclick = () => {
        fetch("/logout")
          .then(response => {
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            currentSession = null;
            updateUI();
          })
          .catch(error => {
            console.error("Logout failed:", error);
          });
      };
      addMoviesBtn.style.display = "inline";
    } else {
      removeMovies();
      authBtn.textContent = "Login";
      authBtn.onclick = () => {
        const loginForm = document.getElementById("loginForm");
        loginForm.reset();
        document.getElementById("loginDialog").showModal();
      };
      addMoviesBtn.style.display = "none";
    }
  }

  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    fetch("/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: formData.get("username"),
        password: formData.get("password"),
      }),
    })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => {
        currentSession = data;
        document.getElementById("loginDialog").close();
        updateUI();
        loadMovies();
      })
      .catch(error => {
        console.error("Login failed:", error);
        alert(messages.loginFailed);
      });
  });

  document.getElementById("cancelLogin").addEventListener("click", () => {
    document.getElementById("loginDialog").close();
  });

  document.getElementById("addMoviesBtn").addEventListener("click", () => {
    const searchForm = document.getElementById("searchForm");
    searchForm.reset();
    document.getElementById("searchResults").innerHTML = "";
    document.getElementById("searchDialog").showModal();
  });

  document.getElementById("searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const query = document.getElementById("query").value.trim();
    searchMovies(query);
  });

  document.getElementById("cancelSearch").addEventListener("click", () => {
    document.getElementById("searchDialog").close();
  });
};
