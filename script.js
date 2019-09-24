//waits for page to load
$(document).ready()

//global variable declarations
let artistNames = [];
let artistName = "";
let playlistID = "";
let artistID = [];
let trackIDs = [];
let clientid = "d4ea6ecd0c0d405b82714e9a7d4b4c63";
let accessToken = "";
let userID = "";
let currentURL = window.location.href;
let songInfo = [];
let isRunning = false;


//runs on page reload
getToken();
document.getElementById("spinner").style.visibility = "hidden";
document.getElementById("fader").style.visibility = "hidden";

//ajax cors anywhere prefilter
jQuery.ajaxPrefilter(function (options) {
    if (options.crossDomain && jQuery.support.cors) {
        options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
    }
});

//click handlers for different elements on the page
$("#submit").on("click", function (event) {
    event.preventDefault();
    submit();
});

$("#login").on("click", function (event) {
    event.preventDefault();
    authorize();
})

//function that runs when the submit button is pressed. just moved the code out of the click handler to make things easier
function submit() {
    //clears global variables for subsequent searches
    if (isRunning === false) {
        isRunning = true;
        artistNames = [];
        artistName = "";
        playlistID = "";
        artistID = [];
        trackIDs = [];
        songInfo = [];
        document.getElementById("spinner").style.visibility = "visible";
        document.getElementById("fader").style.visibility = "visible";
        //if user is logged in (access token from query URL present)
        if (accessToken != "noUser") {
            artistName = $("#inputArtist").val().trim()
            artistNames.push(artistName);
            $.ajax({
                url: "https://tastedive.com/api/similar?q=" + artistName + "&limit=5&k=346362-Playlist-KUO95N87",
                method: "GET"
            }).then(function (response) {
                for (var i = 0; i < response.Similar.Results.length; i++) {
                    artistNames.push(response.Similar.Results[i].Name);
                }
                console.log(artistNames);
                if (artistNames.length < 2) {
                    document.getElementById("spinner").style.visibility = "hidden";
                    document.getElementById("fader").style.visibility = "hidden";
                    alert("Sorry, we didn't return any results for the artist " + artistName + ". Try checking the spelling and try again");
                }
                else {
                    getArtists(artistNames, getTopTracks);
                }
            });
        }
        //if user is not logged in
        else {
            alert("You need to log in to Spotify to do that.");
        }
    }
    else{
        return;
    }
}

//takes an array of artist names in text and a callback function. converts array into numerical spoitify IDs and pushes to artistID array (global), then runs callbuck function using the array it populated
function getArtists(artists, callback) {
    let artistCount = 0;
    for (let artist of artists) {
        console.log("getting id for " + artist);
        $.ajax({
            url: "https://api.spotify.com/v1/search?q=" + artist + "&type=artist",
            method: "GET",
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        }).then(function (response) {
            artistID.push(response.artists.items[0].id);
            if (artistCount >= artists.length - 1) {
                callback(artistID);
            }
            artistCount++;
        }).catch(function (error) {
            console.log(error);
        });
    }
}

//takes the array of track IDs and converts them into javascript objects containing song information,  then runs tableMaker
function getSongInfo() {
    //constructs query string
    let songQuery = "";
    for (var i = 0; i < trackIDs.length; i++) {
        if (i >= trackIDs.length - 1) {
            songQuery += trackIDs[i];
        }
        else {
            songQuery += trackIDs[i] + ",";
        }
    }
    //preforms api call for song information
    console.log("assembled info query : " + songQuery);
    $.ajax({
        url: "https://api.spotify.com/v1/tracks?ids=" + songQuery,
        method: "GET",
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    }).then(function (response) {
        //puts the returned info into a global array for use later
        console.log(response);
        let songArray = response.tracks;
        for (var i = 0; i < songArray.length; i++) {
            songInfo.push({ title: songArray[i].name, artist: songArray[i].artists[0].name, album: songArray[i].album.name, year: songArray[i].album.release_date });
        }
        console.log("Created song data array at songInfo");
        console.log(songInfo);
        //adds images and titles to carousel
        for (var i = 1; i < 11; i += 2) {
            $("#artist-" + i).attr("src", songArray[i].album.images[1].url);
            $("#artist-name-" + i).text(songInfo[i].artist);
        }
        tableMaker();
    })
}

//puts the information from songInfo array on the page
function tableMaker() {
    //empties exsisting table(s)
    $("#song-table").empty();
    console.log("cleared exsisting table(s)")
    console.log("beginning table construction");
    //constructs new table, appends to table element
    for (var i = 0; i < songInfo.length; i++) {
        let songPoint = i;
        let newTR = $("<tr>");
        newTR.attr("class", "thead-light");
        let songTD = $("<td>");
        songTD.text(songInfo[songPoint].title);
        songTD.attr("scope", "col");
        let artistTD = $("<td>");
        artistTD.text(songInfo[songPoint].artist);
        artistTD.attr("scope", "col");
        let albumTD = $("<td>");
        albumTD.text(songInfo[songPoint].album);
        albumTD.attr("scope", "col");
        let releaseTD = $("<td>");
        releaseTD.text(songInfo[songPoint].year);
        releaseTD.attr("scope", "col");
        newTR.append(songTD);
        newTR.append(artistTD);
        newTR.append(albumTD);
        newTR.append(releaseTD);
        $("#song-table").append(newTR);
        console.log("pushing object to table");
        isRunning = false;
    }
}

//using numerical spotify IDs in an array (artistID) this function retrieves the top tracks of the artists specified and puts them in the trackIDs array (global)
function getTopTracks(artists) {
    //couting variable
    let artistCount = 0;
    //spotify top track api call
    for (let artist of artists) {
        console.log("getting top tracks for " + artist);
        $.ajax({
            url: "https://api.spotify.com/v1/artists/" + artist + "/top-tracks?country=ES",
            method: "GET",
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        }).then(function (response) {
            if (response.tracks.length > 1) {
                trackIDs.push(response.tracks[0].id);
                trackIDs.push(response.tracks[1].id);
            }
            if (artistCount >= artists.length - 1) {
                console.log("Finished generating track ID list");
                makePlaylist(addTracks);
            }
            artistCount++;
        }).catch(function (error) {
            console.log(error);
        });
    }
}

//calls the spotify authorization page and prompts the user to log in.
function authorize() {
    //if user is not currently logged in (getToken function found no access token), prompts user to authorize the app
    if (accessToken === "" || accessToken === "noUser") {
        window.location.replace("https://accounts.spotify.com/authorize?client_id=d4ea6ecd0c0d405b82714e9a7d4b4c63&redirect_uri=" + currentURL + "&scope=user-read-private%20user-read-email%20playlist-modify-public%20playlist-modify-private&response_type=token&state=123");
    }
    // user cannot log in if already logged in
    else {
        alert("You are already logged in. If your session has expired, please refresh.")
    }
}

//retrieves the user's authorization token
function getToken() {
    let url = window.location.href;
    //checks if URL contains the query url from the spotify callback
    if (url.includes("#")) {
        url = url.substring(url.indexOf("#") + 14, url.indexOf("&"));
        console.log("returned access token: " + url);
        accessToken = url;
    }
    //otherwise, it is set to noUser
    else {
        accessToken = "noUser";
    }
    //prompts the huse to log in
    if (accessToken === "noUser") {
        alert("Please log in to Spotify to continue using Musicify");
    }
    //if there is an access token present, userID is retrieved from spotify api
    else {
        $.ajax({
            url: 'https://api.spotify.com/v1/me',
            method: "GET",
            headers: {
                "Authorization": "Bearer " + accessToken
            }
        }).then(function (response) {
            console.log(response);
            userID = response.id;
            console.log("User ID retrieved as: " + userID);
        })
    }
}

//adds the tracks in the trackIDs array to the playlist and puts it on the embedded web player
function addTracks(tracks) {
    let trackRequest = "";
    let added = 0;
    //query string assembly
    for (let track of tracks) {
        if (added < tracks.length) {
            trackRequest += "spotify:track:" + track + ",";
        }
        else if (added >= tracks.length) {
            trackRequest += "spotify:track:" + track;
        }
        added++;
    }
    //api call using query string
    $.ajax({
        url: "https://api.spotify.com/v1/playlists/" + playlistID + "/tracks?uris=" + trackRequest,
        method: "POST",
        headers: {
            "Authorization": "Bearer " + accessToken
        }
    }).then(function (response) {
        console.log(response);
        console.log("Playlist fully populated, pushing to page");
        $("#playlist").attr("src", "https://open.spotify.com/embed/playlist/" + playlistID);
        getSongInfo();
        document.getElementById("spinner").style.visibility = "hidden";
        document.getElementById("fader").style.visibility = "hidden";
    });

}

//creates a playlist on the user's spotify account, then callbacks to addtracks
function makePlaylist(callback) {
    //calls the spotify api to create an empty playlist for the user
    $.ajax({
        url: "https://api.spotify.com/v1/users/" + userID + "/playlists",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer " + accessToken
        },
        data: JSON.stringify({
            "name": "Musicify : " + artistName
        })
    }).then(function (response) {
        playlistID = response.id;
        console.log("created playlist at id: " + playlistID);
        callback(trackIDs);
    });
}

