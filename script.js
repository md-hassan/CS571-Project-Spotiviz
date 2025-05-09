document.addEventListener("DOMContentLoaded", async function () {
    // Function to adjust map iframe size
    function adjustMapSize() {
        const content = document.querySelector('.content');
        const iframe = document.getElementById('map-iframe');
        
        if (iframe && content) {
            // Ensure the iframe properly fits the container
            iframe.style.width = '100%';
            iframe.style.height = '100%';
        }
    }
    
    // Run on page load
    adjustMapSize();
    
    // Run when window is resized
    window.addEventListener('resize', adjustMapSize);
    
    // Highlight the active button in the sidebar
    function highlightActiveButton() {
        const path = window.location.pathname;
        const buttons = document.querySelectorAll('.sidebar button');
        
        buttons.forEach(button => {
            button.classList.remove('active');
        });

        if (path.includes('index.html') || path.endsWith('/') || path.includes('overview.html')) {
            // Highlight Overview button for both home page and overview page
            buttons[0].classList.add('active');
        } else if (path.includes('music_analytics.html')) {
            buttons[1].classList.add('active');
        } else if (path.includes('genre_analytics.html')) {
            buttons[2].classList.add('active');
        } else if (path.includes('kpi.html')) {
            buttons[3].classList.add('active');
        } else if (path.includes('settings.html')) {
            buttons[4].classList.add('active');
        }
    }
    
    // Run button highlighting
    highlightActiveButton();


    // Load KPI data
    let albums = [];
    let artists = [];
    let songs = [];

    async function fetchAndStoreData() {
        try {
            const albumRes = await fetch('../data/merge_data/all_albums.json');
            const artistRes = await fetch('../data/merge_data/all_artists.json');
            const songRes = await fetch('../data/merge_data/all_songs.json');

            albums = await albumRes.json();
            artists = await artistRes.json();
            songs = await songRes.json();

            console.log("Albums:", albums);
            console.log("Artists:", artists);
            console.log("Songs:", songs);
        } catch (err) {
            console.error("Failed to load data:", err);
        }
    }

    function populateWeekDropdown() {
        const weekSet = new Set([
            ...albums.map(a => a.week),
            ...artists.map(a => a.week),
        ]);

        const weeks = Array.from(weekSet).sort().reverse(); // latest first

        const select = document.getElementById("weekSelect");
        if (!select) return;    
        select.innerHTML = "";

        weeks.forEach(week => {
            const opt = document.createElement("option");
            opt.value = week;
            opt.textContent = week;
            select.appendChild(opt);
        });

        // Load latest week by default
        if (weeks.length > 0) {
            loadKPIsForWeek(weeks[0]);
        }
    }

    window.loadKPIsForWeek =function (week) {
        const albumsThisWeek = albums.filter(a => a.week.trim() === week.trim());
        const artistsThisWeek = artists.filter(a => a.week.trim() === week.trim());
        const songsThisWeek = songs.filter(s => s.week.trim() === week.trim());
        
        const avgAlbumStreak = albumsThisWeek.length
            ? (albumsThisWeek.reduce((sum, a) => sum + parseInt(a.streak), 0) / albumsThisWeek.length).toFixed(1)
            : "N/A";

        const avgArtistWeeks = artistsThisWeek.length
            ? (artistsThisWeek.reduce((sum, a) => sum + parseInt(a.total_weeks), 0) / artistsThisWeek.length).toFixed(1)
            : "N/A";

        const topAlbum = albumsThisWeek[0]?.album || "N/A";
        const topArtist = artistsThisWeek[0]?.artist || "N/A";
        songsThisWeek.sort((a, b) => a.rank - b.rank);
        const topSong = songsThisWeek.length > 0 ? songsThisWeek[0].song : "N/A";


        const kpiData = [
            { value: albumsThisWeek.length || "N/A", label: `Albums (${week})` },
            { value: topAlbum, label: "Top Album" },
            { value: topArtist, label: "Top Artist" },
            { value: topSong, label: "Top Song" },
            { value: avgAlbumStreak, label: "Avg Album Streak" },
            { value: avgArtistWeeks, label: "Avg Artist Total Weeks" }
        ];

        const kpiContainer = document.getElementById("kpiCards");
        kpiContainer.innerHTML = "";

        kpiData.forEach(kpi => {
            const card = document.createElement("div");
            card.className = "kpi-card";
            card.innerHTML = `<div class="kpi-value">${kpi.value}</div><div class="kpi-label">${kpi.label}</div>`;
            kpiContainer.appendChild(card);
        });
    }
    // Run everything
    await fetchAndStoreData();
    populateWeekDropdown();
});
