const bearerToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjk4OTIwNDBmY2Q5NGE2NjM3M2I4MTcwMjExYWU1NSIsIm5iZiI6MTc2ODUwMzk1NS45MjQsInN1YiI6IjY5NjkzYTkzOGYxN2U1Y2Q1YWE4ODJjYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wR22Ym0MqJmDhbQs_-fQXemdHTBr0JeIok07HcYSnzw";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original/";

/* -------------------- URL PARAM -------------------- */
const params = new URLSearchParams(window.location.search);
const tvId = params.get("id");

if (!tvId) {
  window.location.href = "/";
}

/* -------------------- DOM -------------------- */
const titleEl = document.getElementById("tv-title");
const backdropEl = document.getElementById("tv-backdrop");
const seasonSelect = document.getElementById("season-select");
const episodeList = document.getElementById("episode-list");
const castContainer = document.getElementById("cast-container");

/* -------------------- FETCH TV DETAILS -------------------- */
async function fetchTvDetails() {
  const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  const data = await res.json();

  titleEl.textContent = data.original_name;
  backdropEl.src = IMAGE_BASE_URL + data.backdrop_path;

  seasonSelect.innerHTML = "";
  data.seasons.forEach((season) => {
    if (season.season_number === 0) return;

    const option = document.createElement("option");
    option.value = season.season_number;
    option.textContent = `Season ${season.season_number}`;
    seasonSelect.appendChild(option);
  });

  fetchEpisodes(data.seasons.find((s) => s.season_number !== 0).season_number);
  fetchCast();
}

/* -------------------- FETCH EPISODES -------------------- */
async function fetchEpisodes(seasonNumber) {
  episodeList.innerHTML = "";

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    },
  );

  const data = await res.json();

  data.episodes.forEach((ep) => {
    const card = document.createElement("div");
    card.className = "episode-card";

    card.innerHTML = `
      <div class="episode-image">
        <img
          class="episode-thumbnail"
          src="${ep.still_path ? IMAGE_BASE_URL + ep.still_path : ""}"
        />
      </div>
      <div class="episode-details">
        <div class="episode-title">${ep.name}</div>
        <div class="episode-synopsis">${ep.overview || "No overview available"}</div>
      </div>
    `;

    episodeList.appendChild(card);
  });
}

/* -------------------- FETCH CAST -------------------- */
async function fetchCast() {
  const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/credits`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  const data = await res.json();
  castContainer.innerHTML = "";

  data.cast.slice(0, 12).forEach((actor) => {
    const card = document.createElement("div");
    card.className = "cast-card glass";

    card.innerHTML = `
      <img src="${
        actor.profile_path ? IMAGE_BASE_URL + actor.profile_path : ""
      }" />
      <div class="names">
      <div class="cast-name">${actor.name}</div>
      <div class="cast-character">${actor.character}</div>
      </div>
    `;

    castContainer.appendChild(card);
  });
}

/* -------------------- EVENTS -------------------- */
seasonSelect.addEventListener("change", (e) => {
  fetchEpisodes(e.target.value);
});

/* -------------------- INIT -------------------- */
fetchTvDetails();
