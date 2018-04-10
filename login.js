function saveLocalFile(){

  $('#myForm').submit(function() {
    // DO STUFF...
    var usern = document.getElementById('user')

    if(typeof(Storage) !== "undefined") {
             sessionStorage.username = usern.value;//thisNum.toString();
             console.log("Username Saved to sessionStorage: ", usern);
           }
    else{
      console.log("Username not Saved to sessionStorage!");
    }
    // var socket = io.connect("http://localhost:8080");
    // socket.emit('login', {socketID: socket.id, userName: usern.value} ) ;
    return true; // return false to cancel form action
});
  // $("#formid").submit();
}
