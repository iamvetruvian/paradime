crousels = document.querySelectorAll(".crousel");
const searchBar = document.querySelector(".searchbar");
tmdbApiKey = "f29892040fcd94a66373b8170211ae55";
platters = document.querySelectorAll(".platter");
allCards = document.querySelectorAll(".card");
// https://api.themoviedb.org/3/search/movie?api_key=f29892040fcd94a66373b8170211ae55&query=All%20The%20Bright%20Places

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
// tmbd api link:
// api key = f29892040fcd94a66373b8170211ae55
// api read access token = eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjk4OTIwNDBmY2Q5NGE2NjM3M2I4MTcwMjExYWU1NSIsIm5iZiI6MTc2ODUwMzk1NS45MjQsInN1YiI6IjY5NjkzYTkzOGYxN2U1Y2Q1YWE4ODJjYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wR22Ym0MqJmDhbQs_-fQXemdHTBr0JeIok07HcYSnzw
crousels.forEach((crousel) => {
  const leftButton = crousel.querySelector(".scroll-left");
  const rightButton = crousel.querySelector(".scroll-right");
  const scrollControls = crousel.querySelector(".scroll-controls");
  const cardContainer = crousel;

  cardContainer.addEventListener("mouseover", () => {
    scrollControls.style.opacity = "1";
  });

  cardContainer.addEventListener("mouseout", () => {
    scrollControls.style.opacity = "0";
  });

  leftButton.addEventListener("click", () => {
    cardContainer.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  });

  rightButton.addEventListener("click", () => {
    cardContainer.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  });
});
