document.addEventListener("DOMContentLoaded", async () => {
    const loginBtns = document.querySelectorAll(".login-btn");

    if (loginBtns.length === 0) return;

    try {
        // Check if user is logged in
        const res = await fetch("/api/current_user");
        const user = await res.json();

        if (user && user.photos && user.photos.length > 0) {
            // User IS logged in: Replace the button with profile pic & dropdown
            const profilePicUrl = user.photos[0].value;

            loginBtns.forEach(btn => {
                const container = document.createElement("div");
                container.className = "profile-dropdown-container";

                container.innerHTML = `
                    <button class="profile-pic-btn" id="profileDropdownBtn">
                        <img src="${profilePicUrl}" alt="Profile Picture" referrerpolicy="no-referrer">
                    </button>
                    <div class="profile-dropdown-menu" id="profileDropdownMenu">
                        <a href="/history"><i class="fa-solid fa-clock-rotate-left"></i> Watch History</a>
                        <a href="#"><i class="fa-solid fa-bookmark"></i> Bookmarks</a>
                        <a href="#"><i class="fa-solid fa-list-ul"></i> Watch Lists</a>
                        <hr style="border-color: #333; margin: 5px 0;">
                        <a href="/logout"><i class="fa-solid fa-arrow-right-from-bracket"></i> Logout</a>
                    </div>
                `;

                // Replace original login button with our new dropdown component
                btn.parentNode.replaceChild(container, btn);

                // Add toggle functionality to the dropdown
                const dropdownBtn = container.querySelector("#profileDropdownBtn");
                const dropdownMenu = container.querySelector("#profileDropdownMenu");

                dropdownBtn.addEventListener("click", (e) => {
                    e.stopPropagation(); // Stop click from immediately closing
                    dropdownMenu.classList.toggle("show");
                });
            });

            // Close dropdown if user clicks anywhere else on the page
            window.addEventListener("click", () => {
                document.querySelectorAll(".profile-dropdown-menu.show").forEach(menu => {
                    menu.classList.remove("show");
                });
            });

        } else {
            // User is NOT logged in: Clicking the button takes them to Google Login
            loginBtns.forEach(btn => {
                // Ensure it acts as a link rather than a form submit
                btn.type = "button";
                btn.addEventListener("click", (e) => {
                    e.preventDefault();
                    window.location.href = "/auth/google";
                });
            });
        }
    } catch (error) {
        console.error("Failed to check auth status", error);
    }
});

// Search Bar Animation Logic
document.addEventListener("DOMContentLoaded", () => {
    const navbar = document.querySelector(".navbar");
    const searchForm = document.querySelector(".navbar form");
    const searchInput = document.querySelector(".navbar form .searchbar");
    const searchIcon = document.querySelector(".navbar form .fa-magnifying-glass");

    if (navbar && searchForm && searchInput && searchIcon) {
        searchIcon.addEventListener("click", (e) => {
            if (window.innerWidth <= 768 && !navbar.classList.contains("search-expanded")) {
                e.preventDefault(); 
                navbar.classList.add("search-expanded");
                searchInput.focus();
            }
        });

        // Click anywhere in form expands it
        searchForm.addEventListener("click", (e) => {
            if (window.innerWidth <= 768 && !navbar.classList.contains("search-expanded")) {
                e.preventDefault();
                navbar.classList.add("search-expanded");
                searchInput.focus();
            }
        });

        // Shrink when focus is lost
        searchInput.addEventListener("blur", () => {
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    navbar.classList.remove("search-expanded");
                }, 150);
            }
        });
    }
});
