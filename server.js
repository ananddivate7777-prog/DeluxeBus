const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.YOUTUBE_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


/* =====================================================
   ROBOTS.TXT
   ===================================================== */

app.get("/robots.txt", (req, res) => {
    res.type("text/plain");
    res.sendFile(__dirname + "/robots.txt");
});


/* =====================================================
   SITEMAP.XML
   ===================================================== */

app.get("/sitemap.xml", (req, res) => {
    res.type("application/xml");
    res.sendFile(__dirname + "/sitemap.xml");
});


/* =====================================================
   GET PLAYLIST
   ===================================================== */

app.get("/api/playlist", async (req, res) => {

    try {

        const playlistId = req.query.playlistId;

        /* Check playlist ID */

        if (!playlistId) {

            return res.status(400).json({
                error: "Playlist ID is required"
            });

        }


        /* Check API key */

        if (!API_KEY) {

            return res.status(500).json({
                error: "YouTube API key missing in .env"
            });

        }


        let allVideos = [];
        let nextPageToken = "";


        /* =================================================
           STEP 1
           GET ALL PLAYLIST ITEMS
           ================================================= */

        do {

            const url =
                "https://www.googleapis.com/youtube/v3/playlistItems" +
                "?part=snippet,contentDetails" +
                "&playlistId=" + encodeURIComponent(playlistId) +
                "&maxResults=50" +
                "&key=" + encodeURIComponent(API_KEY) +
                (
                    nextPageToken
                        ? "&pageToken=" + encodeURIComponent(nextPageToken)
                        : ""
                );


            const response = await fetch(url);
            const data = await response.json();


            /* YouTube API error */

            if (!response.ok) {

                console.log("YouTube Playlist API Error:");
                console.log(data);

                return res.status(response.status).json({

                    error:
                        data.error?.message ||
                        "YouTube API error",

                    details: data

                });

            }


            /* Extract videos */

            for (const item of data.items || []) {

                const videoId =
                    item.contentDetails?.videoId;

                const title =
                    item.snippet?.title;


                if (videoId) {

                    allVideos.push({

                        videoId: videoId,

                        title:
                            title ||
                            "Unknown Song"

                    });

                }

            }


            /* Next page */

            nextPageToken =
                data.nextPageToken || "";


        } while (nextPageToken);


        console.log(
            "Playlist:",
            playlistId
        );

        console.log(
            "Total playlist videos:",
            allVideos.length
        );


        /* =================================================
           STEP 2
           CHECK VIDEO STATUS
           ================================================= */

        let playableVideos = [];


        /*
           YouTube videos.list allows max 50 IDs
           per request.
        */

        for (
            let i = 0;
            i < allVideos.length;
            i += 50
        ) {

            const batch =
                allVideos.slice(i, i + 50);


            const videoIds =
                batch
                    .map(video => video.videoId)
                    .join(",");


            const url =
                "https://www.googleapis.com/youtube/v3/videos" +
                "?part=status" +
                "&id=" + encodeURIComponent(videoIds) +
                "&key=" + encodeURIComponent(API_KEY);


            const response = await fetch(url);
            const data = await response.json();


            /* API error */

            if (!response.ok) {

                console.log(
                    "YouTube Video Status API Error:"
                );

                console.log(data);

                return res.status(response.status).json({

                    error:
                        data.error?.message ||
                        "YouTube video status API error",

                    details: data

                });

            }


            /*
               Create map of available videos
            */

            const videoMap = new Map();


            for (const video of data.items || []) {

                const status =
                    video.status || {};


                /*
                   embeddable = false means
                   YouTube player cannot embed it.
                */

                if (
                    status.uploadStatus === "processed" &&
                    status.embeddable !== false
                ) {

                    videoMap.set(
                        video.id,
                        true
                    );

                }

            }


            /*
               Keep only playable videos
            */

            for (const video of batch) {

                if (
                    videoMap.has(video.videoId)
                ) {

                    playableVideos.push(video);

                } else {

                    console.log(
                        "Skipped unavailable/non-embeddable:",
                        video.videoId,
                        video.title
                    );

                }

            }

        }


        /* =================================================
           FINAL RESULT
           ================================================= */

        console.log(
            "Playable videos:",
            playableVideos.length
        );


        console.log(
            "Skipped videos:",
            allVideos.length -
            playableVideos.length
        );


        /* Send to frontend */

        res.json({

            playlistId: playlistId,

            totalVideos:
                allVideos.length,

            playableVideos:
                playableVideos.length,

            skippedVideos:
                allVideos.length -
                playableVideos.length,

            videos:
                playableVideos

        });


    } catch (error) {

        console.error(
            "Server Error:",
            error
        );


        res.status(500).json({

            error: "Server error",

            message:
                error.message

        });

    }

});


/* =====================================================
   START SERVER
   ===================================================== */

app.listen(PORT, () => {

    console.log("");

    console.log(
        "===================================="
    );

    console.log(
        " HORN OK PLEASE SERVER"
    );

    console.log(
        "===================================="
    );

    console.log(
        "Website: http://localhost:" +
        PORT
    );

    console.log(
        "Playlist API: http://localhost:" +
        PORT +
        "/api/playlist"
    );

    console.log(
        "===================================="
    );

    console.log("");

});