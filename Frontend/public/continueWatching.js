document.addEventListener("DOMContentLoaded", async () => {
    const tmdbApiKey = "f29892040fcd94a66373b8170211ae55";
    const imgBaseUrl = "https://image.tmdb.org/t/p/w342";

    try {
        // Check if user is logged in
        const authRes = await fetch("/api/current_user");
        const user = await authRes.json();

        // If not logged in, just exit
        if (!user || user.error || !user.id) {
            return;
        }

        // User is logged in, fetch watch history
        const historyRes = await fetch("/api/history");
        const historyData = await historyRes.json();
        
        if (!historyData || historyData.length === 0) {
            return;
        }

        // Filter items where currentTime < duration (not fully watched)
        const uncompletedItems = historyData.filter(item => {
            return item.currentTime != null && item.duration != null && item.currentTime < item.duration;
        });

        if (uncompletedItems.length === 0) {
            return;
        }

        const continueWatchingSection = document.getElementById("continue-watching-section");
        const carousel = document.getElementById("continue-watching-carousel");
        if (!continueWatchingSection || !carousel) return;

        // Display the section
        continueWatchingSection.classList.remove("d-none");

        // Keep scroll controls if they exist, clear the rest
        const scrollControls = carousel.querySelector(".scroll-controls");
        carousel.innerHTML = "";
        if (scrollControls) {
            carousel.appendChild(scrollControls);
        }

        // Process top uncompleted items (limit to 10 for performance)
        for (const item of uncompletedItems.slice(0, 10)) {
            let imgUrl = "";
            let titleText = "";
            let playUrl = "";

            if (item.mediaType === "tv") {
                // Fetch specific episode details
                try {
                    const epRes = await fetch(`https://api.themoviedb.org/3/tv/${item.tmdbId}/season/${item.season}/episode/${item.episode}?api_key=${tmdbApiKey}`);
                    const epData = await epRes.json();
                    
                    // Fetch show details for the show name
                    const showRes = await fetch(`https://api.themoviedb.org/3/tv/${item.tmdbId}?api_key=${tmdbApiKey}`);
                    const showData = await showRes.json();
                    
                    const showName = showData.name || "Unknown Show";
                    
                    if (epData.still_path) {
                        imgUrl = `${imgBaseUrl}${epData.still_path}`;
                    } else if (showData.backdrop_path) {
                        imgUrl = `https://image.tmdb.org/t/p/w780${showData.backdrop_path}`; // Fallback to backdrop
                    } else if (showData.poster_path) {
                        imgUrl = `${imgBaseUrl}${showData.poster_path}`;
                    }
                    
                    titleText = `${showName}: S${item.season}-E${item.episode}`;
                    playUrl = `/play?type=tv&id=${item.tmdbId}&s=${item.season}&e=${item.episode}`;
                } catch (e) {
                    console.error("Error fetching tv details", e);
                    continue;
                }
            } else {
                // Fetch movie details
                try {
                    const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${item.tmdbId}?api_key=${tmdbApiKey}`);
                    const movieData = await movieRes.json();
                    
                    if (movieData.backdrop_path) {
                        imgUrl = `https://image.tmdb.org/t/p/w780${movieData.backdrop_path}`; // Backdrops look better for this horizontal usually
                    } else if (movieData.poster_path) {
                        imgUrl = `${imgBaseUrl}${movieData.poster_path}`;
                    }
                    
                    titleText = movieData.title || movieData.original_title || "Unknown Movie";
                    playUrl = `/play?type=movie&id=${item.tmdbId}`;
                } catch (e) {
                    console.error("Error fetching movie details", e);
                    continue;
                }
            }
            
            // Calculate progress
            const progressPercent = Math.min((item.currentTime / item.duration) * 100, 100);

            // Construct DOM
            const card = document.createElement("div");
            card.className = "card";
            
            card.onclick = () => {
                window.location.href = playUrl;
            };

            const img = document.createElement("img");
            img.src = imgUrl || "/assets/bg.jpg"; // fallback
            img.alt = titleText;
            img.className = "card-img";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.loading = "lazy";
            img.decoding = "async";

            const overlay = document.createElement("div");
            overlay.className = "card-overlay";

            const textDiv = document.createElement("div");
            textDiv.className = "card-overlay-text";
            textDiv.textContent = titleText;

            const progressContainer = document.createElement("div");
            progressContainer.className = "card-progress-container";

            const progressBar = document.createElement("div");
            progressBar.className = "card-progress-bar";
            progressBar.style.width = `${progressPercent}%`;

            progressContainer.appendChild(progressBar);
            overlay.appendChild(textDiv);
            overlay.appendChild(progressContainer);

            card.appendChild(img);
            card.appendChild(overlay);

            carousel.appendChild(card);
        }

        // Add scroll logic for this new carousel
        const leftButton = carousel.querySelector(".scroll-left");
        const rightButton = carousel.querySelector(".scroll-right");
        const scrollControlsAdded = carousel.querySelector(".scroll-controls");

        if (scrollControlsAdded && leftButton && rightButton) {
            carousel.addEventListener("mouseover", () => {
                scrollControlsAdded.style.opacity = "1";
            });

            carousel.addEventListener("mouseout", () => {
                scrollControlsAdded.style.opacity = "0";
            });

            leftButton.addEventListener("click", () => {
                carousel.scrollBy({ left: -300, behavior: "smooth" });
            });

            rightButton.addEventListener("click", () => {
                carousel.scrollBy({ left: 300, behavior: "smooth" });
            });
        }

    } catch (err) {
        console.error("Error setting up Continue Watching", err);
    }
});
