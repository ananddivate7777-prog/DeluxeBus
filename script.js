/* =========================================================
   HORN OK PLEASE - YOUTUBE MUSIC PLAYER
   ========================================================= */

let player = null;
let playerReady = false;

let videoList = [];
let currentVideoIndex = 0;

let progressTimer = null;
let lastVideoId = "";


/* =========================================================
   1. GET PLAYLIST FROM SERVER
   ========================================================= */

async function loadPlaylistFromServer() {

    try {

        console.log("Getting playlist...");

        const playlistId =
            window.PLAYLIST_ID || "";

        if (!playlistId) {

            throw new Error(
                "PLAYLIST_ID is missing"
            );

        }

        const response = await fetch(
            `/api/playlist?playlistId=${encodeURIComponent(playlistId)}`
        );

        const data = await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Playlist API failed"
            );

        }

        console.log(
            "Playlist received:",
            data
        );

        if (
            !data.videos ||
            data.videos.length === 0
        ) {

            throw new Error(
                "Playlist has no videos"
            );

        }

        /*
           Store playlist
        */

        videoList = data.videos.filter(
            video =>
                video &&
                video.videoId &&
                video.title !== "Deleted video"
        );

        console.log(
            "Playable candidates:",
            videoList.length
        );

        if (
            videoList.length === 0
        ) {

            throw new Error(
                "No playable videos found"
            );

        }

        /*
           If player already ready
        */

        if (playerReady) {

            startPlaylist();

        }

    } catch (error) {

        console.error(
            "Playlist loading error:",
            error
        );

        const title =
            document.getElementById("songTitle");

        const artist =
            document.getElementById("songArtist");

        if (title)
            title.textContent =
                "Playlist loading failed";

        if (artist)
            artist.textContent =
                error.message;

    }

}


/* =========================================================
   2. YOUTUBE IFRAME API READY
   ========================================================= */

function onYouTubeIframeAPIReady() {

    console.log(
        "YouTube IFrame API ready"
    );

    player = new YT.Player(
        "youtube-player",
        {

            width: "200",
            height: "200",

            playerVars: {

                autoplay: 0,
                controls: 0,
                disablekb: 1,
                playsinline: 1,
                rel: 0,
                enablejsapi: 1,
                origin: window.location.origin

            },

            events: {

                onReady:
                    onPlayerReady,

                onStateChange:
                    onPlayerStateChange,

                onError:
                    onPlayerError

            }

        }
    );

}


/* =========================================================
   3. PLAYER READY
   ========================================================= */

function onPlayerReady() {

    console.log(
        "YouTube player ready"
    );

    playerReady = true;

    if (
        videoList.length > 0
    ) {

        startPlaylist();

    }

    startProgressTimer();

}


/* =========================================================
   4. START PLAYLIST
   ========================================================= */

function startPlaylist() {

    if (
        !player ||
        !playerReady ||
        videoList.length === 0
    ) {

        return;

    }

    /*
       Random starting song
    */

    currentVideoIndex =
        Math.floor(
            Math.random() *
            videoList.length
        );

    console.log(
        "Starting index:",
        currentVideoIndex
    );

    playCurrentVideo(false);

}


/* =========================================================
   5. PLAY CURRENT VIDEO
   ========================================================= */

function playCurrentVideo(autoplay = false) {

    if (
        !playerReady ||
        !player ||
        videoList.length === 0
    ) {

        return;

    }

    /*
       Safety
    */

    if (
        currentVideoIndex < 0
    ) {

        currentVideoIndex = 0;

    }

    if (
        currentVideoIndex >=
        videoList.length
    ) {

        currentVideoIndex = 0;

    }

    const video =
        videoList[currentVideoIndex];

    if (
        !video ||
        !video.videoId
    ) {

        goToNextVideo();

        return;

    }

    console.log(
        "Loading video:",
        video.videoId,
        video.title
    );

    lastVideoId = "";

    /*
       Show title immediately
    */

    updateSongText(video);

    /*
       IMPORTANT:
       Do NOT use cuePlaylist().
       Load only one video.
    */

    if (autoplay) {

        player.loadVideoById(
            video.videoId
        );

    } else {

        player.cueVideoById(
            video.videoId
        );

    }

}


/* =========================================================
   6. PLAY / PAUSE
   ========================================================= */

document
    .getElementById("playBtn")
    .addEventListener(
        "click",
        function () {

            if (
                !playerReady ||
                !player
            ) {

                console.log(
                    "Player is not ready"
                );

                return;

            }

            const state =
                player.getPlayerState();

            if (
                state ===
                YT.PlayerState.PLAYING
            ) {

                player.pauseVideo();

            } else {

                player.playVideo();

            }

        }
    );


/* =========================================================
   7. PREVIOUS SONG
   ========================================================= */

document
    .getElementById("previousBtn")
    .addEventListener(
        "click",
        function () {

            if (
                !playerReady
            ) return;

            currentVideoIndex--;

            if (
                currentVideoIndex < 0
            ) {

                currentVideoIndex =
                    videoList.length - 1;

            }

            console.log(
                "Previous:",
                currentVideoIndex
            );

            playCurrentVideo(true);

        }
    );


/* =========================================================
   8. NEXT SONG
   ========================================================= */

document
    .getElementById("nextBtn")
    .addEventListener(
        "click",
        function () {

            if (
                !playerReady
            ) return;

            goToNextVideo();

        }
    );


/* =========================================================
   9. NEXT VIDEO FUNCTION
   ========================================================= */

function goToNextVideo() {

    if (
        videoList.length === 0
    ) {

        return;

    }

    currentVideoIndex++;

    /*
       Last song → first song
    */

    if (
        currentVideoIndex >=
        videoList.length
    ) {

        currentVideoIndex = 0;

    }

    console.log(
        "Next:",
        currentVideoIndex
    );

    playCurrentVideo(true);

}


/* =========================================================
   10. YOUTUBE PLAYER STATE
   ========================================================= */

function onPlayerStateChange(event) {

    console.log(
        "Player state:",
        event.data
    );


    /*
       PLAYING
    */

    if (
        event.data ===
        YT.PlayerState.PLAYING
    ) {

        document.getElementById(
            "playIcon"
        ).textContent = "❚❚";

        const image =
            document.querySelector(
                ".song-image"
            );

        if (image) {

            image.classList.add(
                "playing"
            );

        }

        updateCurrentSong();

    }


    /*
       PAUSED
    */

    else if (
        event.data ===
        YT.PlayerState.PAUSED
    ) {

        document.getElementById(
            "playIcon"
        ).textContent = "▶";

        const image =
            document.querySelector(
                ".song-image"
            );

        if (image) {

            image.classList.remove(
                "playing"
            );

        }

    }


    /*
       ENDED
    */

    else if (
        event.data ===
        YT.PlayerState.ENDED
    ) {

        document.getElementById(
            "playIcon"
        ).textContent = "▶";

        const image =
            document.querySelector(
                ".song-image"
            );

        if (image) {

            image.classList.remove(
                "playing"
            );

        }

        /*
           Automatically play next
        */

        goToNextVideo();

    }


    /*
       CUED
    */

    else if (
        event.data ===
        YT.PlayerState.CUED
    ) {

        document.getElementById(
            "playIcon"
        ).textContent = "▶";

        const image =
            document.querySelector(
                ".song-image"
            );

        if (image) {

            image.classList.remove(
                "playing"
            );

        }

        updateCurrentSong();

    }

}


/* =========================================================
   11. UPDATE CURRENT SONG
   ========================================================= */

function updateCurrentSong() {

    if (
        !playerReady ||
        !player
    ) {

        return;

    }

    try {

        const videoData =
            player.getVideoData();

        if (
            !videoData ||
            !videoData.video_id
        ) {

            return;

        }

        const videoId =
            videoData.video_id;

        /*
           Find index
        */

        const foundIndex =
            videoList.findIndex(
                function (video) {

                    return (
                        video.videoId ===
                        videoId
                    );

                }
            );

        if (
            foundIndex !== -1
        ) {

            currentVideoIndex =
                foundIndex;

        }

        /*
           Don't update same video
        */

        if (
            videoId === lastVideoId
        ) {

            return;

        }

        lastVideoId =
            videoId;

        const video =
            videoList[currentVideoIndex];

        const title =
            videoData.title ||
            video?.title ||
            "Unknown Song";

        const artist =
            videoData.author ||
            "YouTube Music";

        document.getElementById(
            "songTitle"
        ).textContent =
            title;

        document.getElementById(
            "songArtist"
        ).textContent =
            artist;

        document.getElementById(
            "songThumbnail"
        ).src =
            "https://img.youtube.com/vi/" +
            videoId +
            "/hqdefault.jpg";

        console.log(
            "Now playing:",
            title
        );

    } catch (error) {

        console.error(
            "Song information error:",
            error
        );

    }

}


/* =========================================================
   12. UPDATE SONG TEXT
   ========================================================= */

function updateSongText(video) {

    if (!video) return;

    document.getElementById(
        "songTitle"
    ).textContent =
        video.title ||
        "Horn OK Please";

    document.getElementById(
        "songArtist"
    ).textContent =
        "Press ▶ to play";

    if (
        video.videoId
    ) {

        document.getElementById(
            "songThumbnail"
        ).src =
            "https://img.youtube.com/vi/" +
            video.videoId +
            "/hqdefault.jpg";

    }

}


/* =========================================================
   13. PROGRESS TIMER
   ========================================================= */

function startProgressTimer() {

    if (
        progressTimer
    ) {

        clearInterval(
            progressTimer
        );

    }

    progressTimer =
        setInterval(
            function () {

                updateProgressBar();

            },
            500
        );

}


/* =========================================================
   14. PROGRESS BAR
   ========================================================= */

function updateProgressBar() {

    if (
        !playerReady ||
        !player
    ) {

        return;

    }

    try {

        const duration =
            player.getDuration();

        const currentTime =
            player.getCurrentTime();

        if (
            !duration ||
            duration <= 0
        ) {

            return;

        }

        const percentage =
            (
                currentTime /
                duration
            ) * 100;

        const progressBar =
            document.getElementById(
                "progressBar"
            );

        progressBar.value =
            percentage;

        progressBar.style.background =
            `linear-gradient(
                to right,
                #faf9f7 ${percentage}%,
                rgba(255,255,255,0.3) ${percentage}%
            )`;

        document.getElementById(
            "currentTime"
        ).textContent =
            formatTime(
                currentTime
            );

        document.getElementById(
            "duration"
        ).textContent =
            formatTime(
                duration
            );

    } catch (error) {

        /*
           Ignore temporary errors
        */

    }

}


/* =========================================================
   15. SEEK
   ========================================================= */

document
    .getElementById("progressBar")
    .addEventListener(
        "input",
        function () {

            if (
                !playerReady ||
                !player
            ) return;

            const duration =
                player.getDuration();

            if (
                !duration ||
                duration <= 0
            ) return;

            const percentage =
                Number(this.value);

            const newTime =
                duration *
                (
                    percentage / 100
                );

            player.seekTo(
                newTime,
                true
            );

        }
    );


/* =========================================================
   16. FORMAT TIME
   ========================================================= */

function formatTime(seconds) {

    if (
        !seconds ||
        isNaN(seconds)
    ) {

        return "0:00";

    }

    seconds =
        Math.floor(seconds);

    const minutes =
        Math.floor(
            seconds / 60
        );

    const remainingSeconds =
        seconds % 60;

    return (
        minutes +
        ":" +
        String(
            remainingSeconds
        ).padStart(2, "0")
    );

}


/* =========================================================
   17. YOUTUBE ERROR HANDLER
   ========================================================= */

function onPlayerError(event) {

    console.error(
        "YouTube Player Error:",
        event.data
    );

    const errorCode =
        event.data;

    /*
       100 =
       Video unavailable / deleted
    */

    if (
        errorCode === 100
    ) {

        console.log(
            "Video unavailable. Skipping..."
        );

        skipUnavailableVideo();

        return;

    }


    /*
       101 / 150 =
       Embedding disabled
    */

    if (
        errorCode === 101 ||
        errorCode === 150
    ) {

        console.log(
            "Embedding disabled. Skipping..."
        );

        skipUnavailableVideo();

        return;

    }


    /*
       Error 2 =
       Invalid video ID
    */

    if (
        errorCode === 2
    ) {

        console.log(
            "Invalid video ID. Skipping..."
        );

        skipUnavailableVideo();

        return;

    }


    /*
       Other errors
    */

    document.getElementById(
        "songTitle"
    ).textContent =
        "Unable to play this song";

    document.getElementById(
        "songArtist"
    ).textContent =
        "YouTube error " +
        errorCode;

}


/* =========================================================
   18. SKIP UNAVAILABLE VIDEO
   ========================================================= */

function skipUnavailableVideo() {

    document.getElementById(
        "songTitle"
    ).textContent =
        "Skipping unavailable song...";

    document.getElementById(
        "songArtist"
    ).textContent =
        "Trying next song";

    /*
       Don't get stuck
    */

    setTimeout(
        function () {

            goToNextVideo();

        },
        500
    );

}


/* =========================================================
   19. START
   ========================================================= */

loadPlaylistFromServer();


/* =========================================================
   20. PLAYLIST DROPDOWN
   ========================================================= */

function togglePlaylistMenu() {

    const menu =
        document.getElementById(
            "playlistMenu"
        );

    if (
        menu.style.display ===
        "block"
    ) {

        menu.style.display =
            "none";

    } else {

        menu.style.display =
            "block";

    }

}


/* =========================================================
   21. CLOSE DROPDOWN OUTSIDE CLICK
   ========================================================= */

document.addEventListener(
    "click",
    function (event) {

        const dropdown =
            document.querySelector(
                ".playlist-dropdown"
            );

        if (
            dropdown &&
            !dropdown.contains(
                event.target
            )
        ) {

            document.getElementById(
                "playlistMenu"
            ).style.display =
                "none";

        }

    }
);


/* =========================================================
   22. CURRENT PLAYLIST
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const currentPage =
            window.location.pathname
                .split("/")
                .pop()
                .toLowerCase();

        const playlistLinks =
            document.querySelectorAll(
                ".playlist-menu a"
            );

        playlistLinks.forEach(
            function (link) {

                const linkPage =
                    link.getAttribute(
                        "href"
                    )
                    .split("/")
                    .pop()
                    .toLowerCase();

                if (
                    linkPage ===
                    currentPage
                ) {

                    link.classList.add(
                        "current-playlist"
                    );

                    link.addEventListener(
                        "click",
                        function (event) {

                            event.preventDefault();

                        }
                    );

                }

            }
        );

    }
);