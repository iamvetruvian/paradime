document.addEventListener("DOMContentLoaded", async () => {
    const tmdbApiKey = "f29892040fcd94a66373b8170211ae55";
    const imgBaseUrl = "https://image.tmdb.org/t/p/w342";
    
    const container = document.getElementById("history-container");
    const loading = document.getElementById("history-loading");

    try {
        const authRes = await fetch("/api/current_user");
        const user = await authRes.json();
        
        if (!user || user.error || !user.id) {
            loading.innerHTML = `<p class="mt-2 text-danger">Please log in to view your watch history.</p>`;
            return;
        }

        const historyRes = await fetch("/api/history");
        let historyData = await historyRes.json();
        
        if (!historyData || historyData.length === 0) {
            loading.innerHTML = `<p class="mt-2 text-muted">Your watch history is empty.</p>`;
            return;
        }

        loading.classList.add("d-none"); // Hide Loading

        // Ensure chronological sorting (recent to older)
        historyData.sort((a,b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime());

        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const todayTime = todayStart.getTime();
        const msPerDay = 86400000;

        const buckets = {
            "Today": [],
            "Yesterday": [],
            "This Week": [],
            "This Month": [],
            "Older": []
        };

        for (const item of historyData) {
            const watchTime = new Date(item.lastWatchedAt).getTime();
            if (watchTime >= todayTime) {
                buckets["Today"].push(item);
            } else if (watchTime >= (todayTime - msPerDay)) {
                buckets["Yesterday"].push(item);
            } else if (watchTime >= (todayTime - msPerDay * 7)) {
                buckets["This Week"].push(item);
            } else if (watchTime >= (todayTime - msPerDay * 30)) {
                buckets["This Month"].push(item);
            } else {
                buckets["Older"].push(item);
            }
        }

        for (const [bucketName, items] of Object.entries(buckets)) {
            if (items.length === 0) continue;

            const sectionDiv = document.createElement("div");
            sectionDiv.className = "history-section";
            
            const titleH2 = document.createElement("h2");
            titleH2.className = "history-section-title";
            titleH2.textContent = bucketName;
            sectionDiv.appendChild(titleH2);

            const gridDiv = document.createElement("div");
            gridDiv.className = "history-grid";

            // Process each item in this bucket
            for (const item of items) {
                let imgUrl = "";
                let titleText = "";
                let playUrl = "";

                if (item.mediaType === "tv") {
                    try {
                        const epRes = await fetch(`https://api.themoviedb.org/3/tv/${item.tmdbId}/season/${item.season}/episode/${item.episode}?api_key=${tmdbApiKey}`);
                        const epData = await epRes.json();
                        
                        const showRes = await fetch(`https://api.themoviedb.org/3/tv/${item.tmdbId}?api_key=${tmdbApiKey}`);
                        const showData = await showRes.json();
                        
                        const showName = showData.name || "Unknown Show";
                        if (epData.still_path) imgUrl = `${imgBaseUrl}${epData.still_path}`;
                        else if (showData.backdrop_path) imgUrl = `https://image.tmdb.org/t/p/w780${showData.backdrop_path}`;
                        else if (showData.poster_path) imgUrl = `${imgBaseUrl}${showData.poster_path}`;
                        
                        titleText = `${showName}: S${item.season}-E${item.episode}`;
                        playUrl = `/play?type=tv&id=${item.tmdbId}&s=${item.season}&e=${item.episode}`;
                    } catch(e) { console.error(e); continue; }
                } else {
                    try {
                        const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${item.tmdbId}?api_key=${tmdbApiKey}`);
                        const movieData = await movieRes.json();
                        
                        if (movieData.backdrop_path) imgUrl = `https://image.tmdb.org/t/p/w780${movieData.backdrop_path}`;
                        else if (movieData.poster_path) imgUrl = `${imgBaseUrl}${movieData.poster_path}`;
                        
                        titleText = movieData.title || movieData.original_title || "Unknown Movie";
                        playUrl = `/play?type=movie&id=${item.tmdbId}`;
                    } catch(e) { console.error(e); continue; }
                }

                // Progress calculation
                const progressPercent = (item.currentTime && item.duration) ? Math.min((item.currentTime / item.duration) * 100, 100) : 100;

                const cardBox = document.createElement("div");
                cardBox.className = "card history-card-item";
                
                cardBox.onclick = () => {
                    window.location.href = playUrl;
                };

                const imgDOM = document.createElement("img");
                imgDOM.src = imgUrl || "/assets/bg.jpg";
                imgDOM.alt = titleText;
                imgDOM.className = "card-img";

                const overlayDOM = document.createElement("div");
                overlayDOM.className = "card-overlay";

                const txtDOM = document.createElement("div");
                txtDOM.className = "card-overlay-text";
                txtDOM.textContent = titleText;
                
                overlayDOM.appendChild(txtDOM);

                // Add progress bar if not 100% or explicitly requested. We'll show it for all history items visually matching continueWatching
                if (progressPercent > 0) {
                    const progCont = document.createElement("div");
                    progCont.className = "card-progress-container";
                    const progBar = document.createElement("div");
                    progBar.className = "card-progress-bar";
                    progBar.style.width = `${progressPercent}%`;
                    progCont.appendChild(progBar);
                    overlayDOM.appendChild(progCont);
                }

                cardBox.appendChild(imgDOM);
                cardBox.appendChild(overlayDOM);

                gridDiv.appendChild(cardBox);
            }
            sectionDiv.appendChild(gridDiv);
            container.appendChild(sectionDiv);
        }

        if (container.innerHTML.trim() === '') {
            container.innerHTML = `<p class="mt-2 text-muted text-center">Your watch history is empty.</p>`;
        }

    } catch (err) {
        console.error(err);
        loading.innerHTML = `<p class="mt-2 text-danger">Error loading history.</p>`;
    }
});
