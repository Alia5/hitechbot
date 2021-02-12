/* eslint-disable */
export function newGetImage(clicked) {
    // Stopwatch Start
    if($('#started').val() == '0') {
       $('#gametime').stopwatch().stopwatch('start');
       $('#started').val('1')
   }

   // Blockings
   let blockedImg = $('#card' + clicked).attr('blocked');
   let doneImg = $('#card' + clicked).attr('blocked');

   if(blockedImg == "0" && doneImg == "0") {
       $.get("/game/do/image",
       {
           id: $("#id").val(),
           clicked: clicked
       },
       function(data, status){
           if(status == "success") {
               data = JSON.parse(data);
               if(data.number != "false") {
                   let id = $("#id").val();

                   $('#card' + clicked).attr('blocked', '1');
                   $('#card' + clicked).attr('dflt', 'default=' + data.default + '&image=' + data.image + '&game=' + data.id);
                   
                   // discard original setImageFunction calls
                //    $('#card' + data.number).attr('src', '/game/image/' + data.image);
                //    setMiddleImage('/game/image/' + data.image);
                   // call to our hook.
                   void getImageHook(clicked, data);

                   // New pair
                   if(data.newpair != "false") {
                       $('#card' + data.pair[0]).attr('done', '1');
                       $('#card' + data.pair[1]).attr('done', '1');
                   }

                   // Reset pair
                   if(data.reset != "") {
                       resetCards();
                   }

                   // Game done
                   if(data.done == "true") {
                       //alert("Glückwunsch! Du hast das Spiel erfolgreich beendet! Dein Spiel wird jetzt ausgewertet und später im Dashboard angezeigt.");
                       window.location.replace("/dashboard");
                   }

                   // Game Cancel
                   if(data.cancel == "true") {
                       //alert("Tut uns leid! Du hast das Spiel leider nicht erfolgreich beendet!");
                       window.location.replace("/dashboard");
                   }
               }
           }
       });
   }
}
/* eslint-enable */
