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
   1. GET PLAYLIST FROM OUR BACKEND
   ========================================================= */

async function loadPlaylistFromServer() {

    try {

        console.log("Getting playlist...");


        const response = await fetch("/api/playlist");


        if (!response.ok) {

            const errorData = await response.json();

            throw new Error(
                errorData.error ||
                "Playlist API failed"
            );

        }


        const data = await response.json();


        console.log(
            "Playlist received:",
            data
        );


        if (
            !data.videos ||
            data.videos.length === 0
        ) {

            throw new Error(
                "Playlist has no playable videos"
            );

        }


        /*
           Store complete playlist
        */

        videoList = data.videos;


        console.log(
            "Total songs:",
            videoList.length
        );


        /*
           If YouTube player is already ready,
           load playlist immediately.
        */

        if (playerReady) {

            loadVideosIntoPlayer();

        }


    } catch (error) {

        console.error(
            "Playlist loading error:",
            error
        );


        document.getElementById("songTitle")
            .textContent =
            "Playlist loading failed";


        document.getElementById("songArtist")
            .textContent =
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


    /*
       Playlist may already have arrived
    */

    if (
        videoList.length > 0
    ) {

        loadVideosIntoPlayer();

    }


    startProgressTimer();

}


/* =========================================================
   4. LOAD VIDEO IDs INTO YOUTUBE PLAYER
   ========================================================= */

function loadVideosIntoPlayer() {

    if (
        !player ||
        !playerReady ||
        videoList.length === 0
    ) {

        return;

    }


    /*
       Extract only video IDs
    */

    const videoIds =
        videoList.map(
            function (video) {

                return video.videoId;

            }
        );


    console.log(
        "Loading",
        videoIds.length,
        "videos into YouTube player"
    );


    /*
       Cue playlist first.

       It does NOT automatically start playing.
       User will press Play.
    */

    // Pick a random song every time the website opens
const randomIndex =
    Math.floor(Math.random() * videoIds.length);

console.log(
    "Random song index:",
    randomIndex
);

player.cuePlaylist(
    videoIds,
    randomIndex,
    0
);

currentVideoIndex = randomIndex;


    currentVideoIndex = 0;


    /*
       Give YouTube time to load
       first video's metadata.
    */

    setTimeout(
        function () {

            updateCurrentSong();

        },
        1000
    );

}


/* =========================================================
   5. PLAY / PAUSE
   ========================================================= */

document
    .getElementById("playBtn")
    .addEventListener(
        "click",
        function () {

            if (
                !playerReady
            ) {

                console.log(
                    "Player is not ready"
                );

                return;

            }


            const state =
                player.getPlayerState();


            /*
               Currently playing
            */

            if (
                state ===
                YT.PlayerState.PLAYING
            ) {

                player.pauseVideo();

            }


            /*
               Currently paused / cued / stopped
            */

            else {

                player.playVideo();

            }

        }
    );


/* =========================================================
   6. PREVIOUS SONG
   ========================================================= */

document
    .getElementById("previousBtn")
    .addEventListener(
        "click",
        function () {

            if (
                !playerReady
            ) return;


            console.log(
                "Previous button clicked"
            );


            player.previousVideo();


            /*
               Update information after
               YouTube changes video.
            */

            setTimeout(
                updateCurrentSong,
                700
            );

        }
    );


/* =========================================================
   7. NEXT SONG
   ========================================================= */

document
    .getElementById("nextBtn")
    .addEventListener(
        "click",
        function () {

            if (
                !playerReady
            ) return;


            console.log(
                "Next button clicked"
            );


            player.nextVideo();


            setTimeout(
                updateCurrentSong,
                700
            );

        }
    );


/* =========================================================
   8. YOUTUBE PLAYER STATE
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


        updateCurrentSong();

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


        updateCurrentSong();

    }

}


/* =========================================================
   9. UPDATE CURRENT SONG
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
           Find current video index
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
           Don't update same song
           unnecessarily.
        */

        if (
            videoId === lastVideoId
        ) {

            return;

        }


        lastVideoId = videoId;


        /*
           Song title
        */

        const title =
            videoData.title ||
            (
                videoList[currentVideoIndex]
                ?.title ||
                "Unknown Song"
            );


        /*
           Artist / channel
        */

        const artist =
            videoData.author ||
            "YouTube Music";


        document.getElementById(
            "songTitle"
        ).textContent = title;


        document.getElementById(
            "songArtist"
        ).textContent = artist;


        /*
           Thumbnail
        */

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
   10. UPDATE SONG TEXT FROM API
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
   11. PROGRESS BAR
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

                if (
                    !playerReady ||
                    !player
                ) {

                    return;

                }


                try {

                    const current =
                        player.getCurrentTime();


                    const duration =
                        player.getDuration();


                    if (
                        duration > 0
                    ) {

                        const percentage =
                            (
                                current /
                                duration
                            ) * 100;


                        document.getElementById(
                            "progressBar"
                        ).value =
                            percentage;


                        document.getElementById(
                            "currentTime"
                        ).textContent =
                            formatTime(
                                current
                            );


                        document.getElementById(
                            "duration"
                        ).textContent =
                            formatTime(
                                duration
                            );

                    }

                } catch (error) {

                    /*
                       Ignore temporary
                       YouTube loading errors.
                    */

                }

            },
            500
        );

}


/* =========================================================
   12. SEEK / PROGRESS BAR
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
   12.1. UPDATE PROGRESS BAR
   ========================================================= */

function updateProgressBar() {

    if (
        !playerReady ||
        !player
    ) return;

    const duration =
        player.getDuration();

    const currentTime =
        player.getCurrentTime();

    if (
        !duration ||
        duration <= 0
    ) return;

    const percentage =
        (currentTime / duration) * 100;


    const progressBar =
        document.getElementById("progressBar");


    progressBar.value =
        percentage;


    progressBar.style.background =
        `linear-gradient(
            to right,
            #faf9f7 ${percentage}%,
            rgba(255,255,255,0.3) ${percentage}%
        )`;
}


/* Update every 500 milliseconds */

setInterval(
    updateProgressBar,
    500
);


/* =========================================================
   13. FORMAT TIME
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
   14. YOUTUBE ERROR
   ========================================================= */

function onPlayerError(event) {

    console.error(
        "YouTube Error:",
        event.data
    );


    /*
       Error 101 / 150:
       Embedding is disabled for this video.

       Automatically skip to next song.
    */

    if (
        event.data === 101 ||
        event.data === 150
    ) {

        document.getElementById(
            "songTitle"
        ).textContent =
            "Skipping unavailable song...";


        document.getElementById(
            "songArtist"
        ).textContent =
            "This video cannot be embedded";


        setTimeout(
            function () {

                player.nextVideo();

            },
            800
        );


        return;

    }


    /*
       Error 100:
       Video unavailable/private/deleted
    */

    if (
        event.data === 100
    ) {

        document.getElementById(
            "songTitle"
        ).textContent =
            "Song unavailable";


        setTimeout(
            function () {

                player.nextVideo();

            },
            800
        );


        return;

    }


    /*
       Other error
    */

    document.getElementById(
        "songTitle"
    ).textContent =
        "Unable to play this song";


    document.getElementById(
        "songArtist"
    ).textContent =
        "YouTube error " +
        event.data;

}


/* =========================================================
   15. START EVERYTHING
   ========================================================= */

loadPlaylistFromServer();