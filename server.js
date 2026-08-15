const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

const PORT = 3000;

const API_KEY = process.env.YOUTUBE_API_KEY;

app.use(cors());

app.use(express.static(__dirname));


/* =====================================================
   GET PLAYLIST
   ===================================================== */

app.get("/api/playlist", async (req, res) => {

    try {

        /* Get playlist ID from the URL */

        const playlistId = req.query.playlistId;


        /* Check playlist ID */

        if (!playlistId) {

            return res.status(400).json({
                error: "Playlist ID is required"
            });

        }


        /* Check YouTube API key */

        if (!API_KEY) {

            return res.status(500).json({
                error: "YouTube API key missing in .env"
            });

        }


        let allVideos = [];

        let nextPageToken = "";


        /* Get all playlist videos */

        do {

            const url =
                "https://www.googleapis.com/youtube/v3/playlistItems" +
                "?part=snippet,contentDetails" +
                "&playlistId=" + playlistId +
                "&maxResults=50" +
                "&key=" + API_KEY +
                (
                    nextPageToken
                        ? "&pageToken=" + nextPageToken
                        : ""
                );


            const response = await fetch(url);

            const data = await response.json();


            /* YouTube API error */

            if (!response.ok) {

                console.log("YouTube API Error:");

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


            nextPageToken =
                data.nextPageToken || "";


        } while (nextPageToken);


        /* Console information */

        console.log(
            "Playlist:",
            playlistId
        );

        console.log(
            "Videos:",
            allVideos.length
        );


        /* Send playlist to website */

        res.json({

            playlistId: playlistId,

            count: allVideos.length,

            videos: allVideos

        });


    } catch (error) {

        console.error(error);


        res.status(500).json({

            error: "Server error",

            message: error.message

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
        "Website: http://localhost:" + PORT
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