jQuery.ajaxPrefilter(function(options) {
    if (options.crossDomain && jQuery.support.cors) {
        options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
    }
});

$("#submit").on("click", function (event) {
    event.preventDefault();
    console.log("yeet");
    $.ajax({
        url: "https://tastedive.com/api/similar?q=" + $("#artist-search").val() + "&k=346362-Playlist-KUO95N87",
        method: "GET"
    }).then(function (response) {
        console.log(response);
    });
})