jQuery.ajaxPrefilter(function(options) {
    if (options.crossDomain && jQuery.support.cors) {
        options.url = 'https://cors-anywhere.herokuapp.com/' + options.url;
    }
});

$("#submit").on("click", function (event) {
    event.preventDefault();
    $.ajax({
        url: "https://tastedive.com/api/similar?q=" + $("#artist-search").val().trim() + "&k=346362-Playlist-KUO95N87",
        method: "GET"
    }).then(function (response) {
        console.log(response);
        for(var i = 0; i < response.Similar.Results.length; i++){
            console.log(response.Similar.Results[i].Name)
        }
    });
})
