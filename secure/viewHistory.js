

var socket = io.connect("http://localhost:8080");
/*
** Start on viewHistory.html, get playername and login
**/
function start(){

  getLocalFile();
  connectSocket();
}

/*
** Login User
**/
function connectSocket(){
  // var pid = document.getElementById("hiddenUser").value;
  var pid = getUsername();
  socket.emit('login', {socketID: socket.id, userName: pid} )
  return socket.id;
}

/*
** Load the previously Stored Size From Session Storage
**/
function getLocalFile(){
  if(typeof(Storage) !== "undefined" ){
    var usern = sessionStorage.username;
    // number = floor(number);
  }
   else{
    usern = "Unknown ID/ Problem with Session Storage";
  }
  if(typeof(Storage) !== "undefined" ){
    var pQuitGame = sessionStorage.pQuitGame;
    // number = floor(number);
  }
   else{
    pQuitGame = false;
  }
  if(pQuitGame === true){
    pQuitGame = false;
    sessionStorage.pQuitGame = pQuitGame;
    location.reload();
  }


  var userna=document.getElementById('user');
  userna.style.fontSize= '35pt';
  userna.innerHTML = '<b>'+usern+"</b>";
  document.getElementById('hiddenUser').value = usern;
  console.log(document.getElementById('hiddenUser').value);

  getUser(usern);
  return usern;
}

/*
** Logout
**/
function logout(){
  socket.emit('logout', {username: getUsername()});
  window.location = "../login.html";
}

/*
** Get this User from sessionStorage
**/
function getUsername(){
  if(typeof(Storage) !== "undefined" )
    var usern = sessionStorage.username;
   else
    usern = "Unknown ID/ Problem with Session Storage";
  return usern;
}

/*
** Get this User from server and display stats in viewHistory.html
**/
function getUser(usern){
  var userArray1=[];
       var xhttp = new XMLHttpRequest();
       xhttp.open("GET", "/data", false); //false because rest of code must wait to recieve array
      xhttp.onreadystatechange = function() {
          if (xhttp.readyState == 4) {
              if(xhttp.status == 200) {
                  userArray1 = JSON.parse(xhttp.responseText);
                  console.log(xhttp.responseText);
               }
          }
          else if (xhttp.status == 400) {
              console.error("Error Getting JSON");
          }
      };
      xhttp.send();

      var numUsers = Object.keys(userArray1).length
      console.log("UserArray Length is ", numUsers);
      var boxID = 0;
      var table;
      var myTable = document.getElementById("myTable");

        table = document.createElement('TABLE');
        table.border='1';
        table.id = "table";
        table.style = "border-radius: 10px;border: 1px solid black";

      var tableBody = document.createElement('TBODY');

      for (var i=0; i< numUsers; i++){
        if(userArray1[i].username === usern)
          var thisUser = userArray1[i];
      }

        var row = document.createElement('TR');
          var winCell = document.createElement('TD');
          winCell.width = '150';
          var lossCell = document.createElement('TD');
          lossCell.width = '150';
          var tieCell = document.createElement('TD');
          tieCell.width = '150';

          row.appendChild(winCell);
          row.appendChild(lossCell);
          row.appendChild(tieCell);

            winCell.innerHTML = "<b>Wins</b>";
            winCell.setAttribute('style', 'text-align:center;');
            lossCell.innerHTML = "<b>Losses</b>" ;
            lossCell.setAttribute('style', 'text-align:center;');
            tieCell.innerHTML = "<b>Ties</b>" ;
            tieCell.setAttribute('style', 'text-align:center;');

            tableBody.appendChild(row);
            var row2 = document.createElement('TR');
            var winCell2 = document.createElement('TD');
            winCell2.width = '150';
            var lossCell2 = document.createElement('TD');
            lossCell2.width = '150';
            var tieCell2 = document.createElement('TD');
            tieCell2.width = '150';

            winCell2.innerHTML = thisUser.wins;
            winCell2.setAttribute('style', 'text-align:center;');
            lossCell2.innerHTML = thisUser.losses;
            lossCell2.setAttribute('style', 'text-align:center;');
            tieCell2.innerHTML = thisUser.ties;
            tieCell2.setAttribute('style', 'text-align:center;');

            row2.appendChild(winCell2);
            row2.appendChild(lossCell2);
            row2.appendChild(tieCell2);
            tableBody.appendChild(row2);

            table.appendChild(tableBody);

          myTable.appendChild(table);
        }
//

var matchMakePressed = false;
/*
** Try to Matchmake
**/
function gameMatchMake(){
  if(!matchMakePressed){
    matchMakePressed = true;
    var pid = document.getElementById("hiddenUser").value;
    console.log(pid, "socket is trying to matchmake");
    socket.emit('matchMake', {socketID: socket.id, userName: pid} );
  }
}

var gameID;
/*
** Socket On MatchMake Complete, Save Game ID to sessionStorage,
** then change window to game
**/
socket.on('matchMakeComplete', function(data){
  gameID = data.gameID;
  //save game ID to session storage
  if(typeof(Storage) !== "undefined") {
           sessionStorage.gameID = data.gameID;//thisNum.toString();
           console.log("Game ID Saved to sessionStorage: ", gameID);
         }
  else{
    console.log("Game ID not Saved to sessionStorage!");
  }

  window.location = "../secure/game.html";
  // window.location = "./game.html";
});


/*
** Socket On Wait for Players
**/
socket.on('waitForPlayers', function(data){
  var pdiv = document.getElementById("play");
  var table = document.createElement('TABLE');
  table.border='1';
  table.id = "table";

  var tableBody = document.createElement('TBODY');
  table.appendChild(tableBody);

  var header = table.createTHead();
  var row = header.insertRow(0);
  var cell = row.insertCell(-1);
      cell.width = '200';
      cell.setAttribute('style', 'text-align:center;');
      cell.innerHTML = "<b>WAITING FOR ANOTHER PLAYER</b>";
      pdiv.appendChild(table);
});
