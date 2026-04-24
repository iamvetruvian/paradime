const bearerToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjk4OTIwNDBmY2Q5NGE2NjM3M2I4MTcwMjExYWU1NSIsIm5iZiI6MTc2ODUwMzk1NS45MjQsInN1YiI6IjY5NjkzYTkzOGYxN2U1Y2Q1YWE4ODJjYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wR22Ym0MqJmDhbQs_-fQXemdHTBr0JeIok07HcYSnzw";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original/";

const searchBar = document.querySelector(".searchbar");
searchBar.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const value = searchBar.value;
    if (value.length === 0) {
      return;
    } else {
      window.location = `/search?query=${value}`;
    }
  }
});

/* -------------------- 1. Extract TMDb ID -------------------- */
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

if (!movieId) {
  console.error("No movie ID found in URL");
  window.location.href = "/";
}

/* -------------------- 2. Fetch Movie Details -------------------- */
async function fetchMovieDetails() {
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
  });
  data = res.json();
  console.log(data);
  return data;
}

/* -------------------- 9. Fetch Credits -------------------- */
async function fetchMovieCredits() {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  return res.json();
}

/* -------------------- Render Movie Details -------------------- */
function renderMovieDetails(movie) {
  /* Title */
  document.querySelector(".title").textContent = movie.original_title;

  /* Backdrop */
  document.querySelector(".backdrop-image").src =
    IMAGE_BASE_URL + movie.backdrop_path;

  /* Poster */
  document.querySelector(".poster-image").src =
    IMAGE_BASE_URL + movie.poster_path;
  console.log(IMAGE_BASE_URL + movie.poster_path);

  /* Overview */
  document.querySelector(".over-view p").textContent = movie.overview;

  /* Genres */
  const genreContainer = document.querySelector(".genre-tags");
  genreContainer.innerHTML = "";

  movie.genres.forEach((genre) => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = genre.name;
    genreContainer.appendChild(tag);
  });

  /* Origin Country Flags */
  const originContainer = document.querySelector(".lang-origin");
  originContainer.innerHTML = "";

  movie.origin_country.forEach((code) => {
    const img = document.createElement("img");
    img.src = `https://cdn.jsdelivr.net/npm/country-flag-icons@1.5.5/3x2/${code}.svg`;
    img.height = 20;
    originContainer.appendChild(img);
  });

  /* Additional Stats */
  if (movie.release_date) {
    document.querySelector(".release-date").innerHTML =
      `<i class="fa-regular fa-calendar"></i> ${movie.release_date}`;
  }
  if (movie.runtime) {
    document.querySelector(".runtime").innerHTML =
      `<i class="fa-regular fa-clock"></i> ${movie.runtime} min`;
  }
  if (movie.vote_average) {
    document.querySelector(".rating").innerHTML =
      `<i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average.toFixed(1)}/10`;
  }

  /* Tagline */
  if (movie.tagline) {
    document.querySelector(".tagline").textContent = `"${movie.tagline}"`;
  }

  /* Production Companies */
  const productionContainer = document.querySelector(".production-container");
  if (productionContainer) {
    productionContainer.innerHTML = "";
    if (movie.production_companies) {
      movie.production_companies.forEach((company) => {
        if (!company.logo_path) return;
        const img = document.createElement("img");
        img.src = "https://image.tmdb.org/t/p/w300" + company.logo_path;
        img.alt = company.name;
        img.style.height = "40px";
        img.style.objectFit = "contain";
        img.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
        img.style.padding = "5px";
        img.style.borderRadius = "5px";
        img.title = company.name;
        productionContainer.appendChild(img);
      });
    }
  }
}

/* -------------------- Render Cast -------------------- */
function renderCast(credits) {
  const container = document.querySelector(".cast-card-container");
  container.innerHTML = "";

  credits.cast.forEach((actor) => {
    if (!actor.profile_path) return;
    // console.log(IMAGE_BASE_URL + actor.profile_path);

    const card = document.createElement("div");
    card.className = "cast-card";

    card.innerHTML = `
            <img src="${IMAGE_BASE_URL + actor.profile_path}">
            <div class="names">
                <div class="cast-name">${actor.name}</div>
                <div class="character-name">${actor.character}</div>
            </div>
        `;

    card.addEventListener("click", () => {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(actor.name)}`,
        "_blank",
      );
    });

    container.appendChild(card);
  });

  container.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  container.style.padding = "15px";
  container.style.borderRadius = "15px";
}

/* -------------------- Init -------------------- */
(async function init() {
  try {
    const movie = await fetchMovieDetails();
    renderMovieDetails(movie);

    const credits = await fetchMovieCredits();
    renderCast(credits);

    const watchNow = document.querySelector(".watch-now-btn");
    const color = "#fc5b6e";
    watchNow.addEventListener("click", (event) => {
      window.location.href = `/play?type=movie&id=${movieId}`;
      // window.location.href = `https://www.cineby.gd/movie/${movie.id}`;
    });
  } catch (err) {
    console.error("Failed to load movie data", err);
  }
})();
