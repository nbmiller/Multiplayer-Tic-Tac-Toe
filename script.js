

// var socket = io.connect("http://localhost:8080");
var socket = io.connect(window.location.protocol + '//' + window.location.hostname);
// var socket = io.connect(window.location.protocol + '//' + window.location.hostname + ':{{port}}');
// var socket = wss.connect(window.location.protocol + '//' + window.location.hostname + ':{{port}}');
var playerS = new Array(); //array of currently selected buttons in game




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
** Get this GameID from sessionStorage
**/
function getGameID(){
  if(typeof(Storage) !== "undefined" )
    var gameid = sessionStorage.gameID;
   else{
    gameid = "Unknown Game ID/ Problem with Session Storage";
  }
  document.getElementById('hiddenGameID').value = gameid;
  // console.log(document.getElementById('hiddenGameID').value);

  return gameid;
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
  var userna=document.getElementById('user');
  userna.style.fontSize= '35pt';
  userna.innerHTML = '<b>'+usern+"</b>";

  var userpic=document.getElementById('userPic');
  var img = document.createElement("img");

  if(playerNum ===1){
    img.src = '../ticX.png';
  }
  else{
    img.src = '../ticO.png';
  }
  img.style.width = "50px";
  img.style.height = "50px";
  userpic.appendChild(img);

  // var handle=document.getElementById('handle');
  // handle.innerHTML = '<b>'+usern+"</b>";

  return usern;
}

/*
** Save Username to Session Storage
**/
function saveLocalFile(){

  $('#myForm').submit(function() {
    var usern = document.getElementById('user')

    if(typeof(Storage) !== "undefined") {
             sessionStorage.username = usern.value;
             console.log("Username Saved to sessionStorage: ", usern);
           }
    else{
      console.log("Username not Saved to sessionStorage!");
    }
    return true; // return false to cancel form action
});
}

/*
** On Socket Login -Needed ????????????????????????????
**/
socket.on('login', function(data){
  var usern = document.getElementById('user');
  socket.emit('login', {socketID: socket.id, userName: usern.value} ) ;
  // console.log(socket.userName, " is logged in (client side)");
});

var gameID;

/*
** Join Game and create Game Table
**/
function startGame(){

  thisGameID= getGameID();
  var pName = getUsername();

  socket.emit('join', {gameID: thisGameID, pName:pName} ) ;

    var boxID = 0;
    var table;
    var tsize = 3;
    var game = document.getElementById("myGame");

      table = document.createElement('TABLE');
      table.border='1';
      table.id = "table";

    var tableBody = document.createElement('TBODY');
    table.appendChild(tableBody);

    var header = table.createTHead();

    for (var i=0; i< tsize; i++){
       var tr = document.createElement('TR');

       tableBody.appendChild(tr);

       for (var j=0; j< tsize; j++){
           var td = document.createElement('TD');
           td.width='100';
           td.height='100';

           var btn = document.createElement('input');
             btn.type = "button";
           btn.className = "btn";
           btn.id = boxID;
           btn.style="width:100%;height:100%";
           btn.onclick = function() {toggleButton(event, tsize)};

          td.appendChild(btn);

          playerS[boxID] = 0;
          boxID++;

           tr.appendChild(td);
       }
    }
    game.appendChild(table);
}

var playerNum;

/*
** On player Successfully Joined
**/
socket.on('joinComplete', function(data){
  playerNum = data.playerNum;
  getLocalFile();
});

var prevPlayer;
var turnCount=0;

/*
** Handle a button press
**/
function toggleButton(event, tsize){
  if(!gameEnded){
  event = event;
  var target = event.target;
  var idN = target.id;
  thisGameID= getGameID();
  socket.emit('bPress', {butPos: idN , gameID: thisGameID, playerNum:
     playerNum, username: getUsername(), tsize: tsize});
   }    //might have to also emit socket ID
}


/*
** On Socket Button Press
**/
socket.on('bPress', function(data){
  var thisBox = document.getElementById(data.butPos);
  var thisPlayer = data.playerNum
  // globPlayerNum= data.playerNum
  var solution;
  var infoBox = document.getElementById('infoScreen');

  // console.log("Player", thisPlayer, "Pressed a Button, name is", data.username)

  //if player 1 and current turn is an even number
  if(thisPlayer === 1 && playerS[data.butPos] ===0 && turnCount%2 ==0){
    thisBox.style.background = "url('../ticX.png')";
    thisBox.style.backgroundSize = "100px 100px";
    thisBox.style.backgroundPosition = "center";
    playerS[data.butPos]= 1;
    console.log("turn: ", turnCount);
    turnCount++;

    solution = checkAnswers(data.tsize);
      if(solution === 1){
        clearInterval(timer);
        infoBox.innerHTML = "Player: " +data.username+ " Won!";
      }
      else if(solution ===2){
        infoBox.innerHTML = prevPlayer+ " Lost!";
      }
  }
  //if player 2 and current turn is an odd number
  else if(thisPlayer === 2 && playerS[data.butPos] ===0&& turnCount%2 !=0){
    thisBox.style.background = "url('../ticO.png')";
    thisBox.style.backgroundSize = "100px 100px";
    thisBox.style.backgroundPosition = "center";
    playerS[data.butPos]= 2;
    console.log("turn: ", turnCount);
    turnCount++;
    solution = checkAnswers(data.tsize);
      if(solution === 2){
        clearInterval(timer);
        infoBox.innerHTML = "Player: " +data.username+ " Won!";
      }
      else if(solution ===1){
        infoBox.innerHTML = prevPlayer+ " Lost!";
      }
  }
  //if there is a winner or game at max turn count
  if(solution > 0 || turnCount === 9 ){
    clearInterval(timer);
    //if max turns and no winner then game is a tie
    if(turnCount===9 && solution === 0){
      for(var i=0;i<9;i++){
        thisBox = document.getElementById(i);
        thisBox.style.backgroundColor= "#f0f72c";
      }
      infoBox.innerHTML = "Tie!";
    }
    gameEnded=true;
    document.getElementById('quit').innerHTML= "Quit";
    //save games stats to DB
    socket.emit('matchComplete', {winner: solution , gameID: data.gameID, playerNum:
       thisPlayer, winnerName: data.username, loserName: prevPlayer, turnCount: turnCount});
       console.log(data.username, "is the winner");
     }
  //set prev player to player who just finished turn
  prevPlayer = data.username;
});

var gameEnded = false;
var otherPlayer;

/*
** Quit Game and try to recieve other player
**/
function quitGame(){
  if(gameEnded === false){
    var thisGameID= getGameID();
    var quitter = getUsername();
    getOtherPlayer(quitter, thisGameID);
  }
  else {
    sendToHistory();
  }
}

/*
** Once Recieved other player update game stats, then redirect user who quit
**/
function recievedOtherPlayer(otherPlayer, quitter){
  var winner = otherPlayer;
    console.log("Winner by default is...", winner, "Emitting to matchComplete");
    gameEnded = true;

    socket.emit('matchComplete', {winner: 2 , gameID: thisGameID,
       winnerName: winner, loserName: quitter, turnCount: turnCount, matchEndedEarly: true});
    // socket.emit('onePlayerQuit', {gameID: thisGameID, winner: winner});
    // sendToHistory();
}


/*
** If Match Ended Early (Coming After Server Game Update Complete)
**/
socket.on('matchEndedEarly', function(data){
   socket.emit('onePlayerQuit', {gameID: data.GameID, winner: data.winner});

    sendToHistory();
});

/*
** On Socket return from server after player quit
**/
socket.on('onePlayerQuit', function(data){
  clearInterval(timer);
  var infoBox = document.getElementById('infoScreen');
  infoBox.innerHTML = "Other Player Quit, You Win!";
  var quitB = document.getElementById('quit');
  quitB.innerHTML= "Quit";
  // socket.emit('changeWinnerQuitButton', {gameID: thisGameID});
  // quitB.onclick= sendToHistory();
  quitB.addEventListener("click", function(event) {
    // Cancel the default action, if needed
    event.preventDefault();
    sendToHistory();
  });
});

/*
** Send to history.html
**/
function sendToHistory(){

 //  var xhttp = new XMLHttpRequest();
 //  xhttp.open("GET", "/viewHistory", false); //false because rest of code must wait to recieve array
 //
 // xhttp.send();
 var pQuitGame = true;

 if(typeof(Storage) !== "undefined") {
          sessionStorage.pQuitGame = pQuitGame;
          console.log("Player Quit Boolean Saved to sessionStorage");
        }
 else{
   console.log("Player Quit Boolean NOT Saved to sessionStorage!");
 }

  // window.location = "./viewHistory.html";
  window.location.replace ("./viewHistory.html");
  // $location.path(["/viewHistory.html"]);

}

/*
** On Socket return from server pass values to recieved function
**/
socket.on('getOtherPlayer', function(data){
  otherPlayer= data.otherPlayer;
  var quitter= data.thisPlayer;
  recievedOtherPlayer(otherPlayer, quitter);
});

/*
** Attempt to retrieve other player present in game from DB
**/
function getOtherPlayer(quitter, thisGameID){
  console.log(quitter, "is forefeiting, getting winner name.");
  socket.emit('getOtherPlayer', {thisPlayer: quitter , gameID: thisGameID});
}

/*
** Update Info Screen of who's turn it is
**/
socket.on('changeTurn', function(data){
  // console.log(data.turnCount, "is the Turn, Entering ChangeTurn");
  var infoBox = document.getElementById('infoScreen');
  if(data.playerNum === 1 && data.turnCount%2 ==0)
    infoBox.innerHTML = "Your Turn!";
  else if(data.playerNum === 2 && data.turnCount%2 !=0)
    infoBox.innerHTML = "Your Turn!";
  else {
    infoBox.innerHTML = "Wait for Other Player!";
  }
  infoBox.style.fontSize = "xx-large";
});
//set timer to update info
var timer = setInterval(function(){ changeInfoScreen() }, 600);
//call this function
function changeInfoScreen(){
  socket.emit('changeTurn', {turnCount: turnCount , gameID: thisGameID, playerNum:
     playerNum, username: getUsername(), prevPlayer: prevPlayer});
}


/*
** Send Message To Other Player
**/

var input = document.getElementById("message");

// Execute a function when the user releases a key on the keyboard
input.addEventListener("keyup", function(event) {
  // Cancel the default action, if needed
  event.preventDefault();
  // Number 13 is the "Enter" key
  if (event.keyCode === 13) {
    // Trigger the button element with a click
    document.getElementById("send").click();
  }
});

function sendMsg(){
    var usern = getUsername();
    var message = document.getElementById('message').value;
    // var output = document.getElementById('output');
    if(message !==""){
      var gameID = getGameID();
      socket.emit('sendMessage', {gameID: gameID,userName: usern,
        message: message});
    }
}

 output = document.getElementById('output');

/*
** On Socket Message Sent
**/
socket.on('messageSent', function(data){
    output.innerHTML += '<p><strong>' + data.userName +
    ":  </strong>"+ data.message +'</p>'
    //empty message text field
    var message = document.getElementById('message').value ="";

});


//Player answer keys arrays
var p1answerKey = new Array();
var p2answerKey = new Array();
  p1answerKey = [1,1,1,1,1,1,1,1,1];
  p2answerKey = [2,2,2,2,2,2,2,2,2];

  /*
  ** Check Answers of Game
  **/
function checkAnswers(tsize){
  var thisBox1;
  var thisBox2;
  var thisBox3;

  for(var j=0;j< tsize;j++){
    //check p1 horiz rows
    if(playerS[j* tsize+0]=== p1answerKey[j* tsize+0] &&
      playerS[j* tsize+1]=== p1answerKey[j* tsize+1] &&
      playerS[j* tsize+2]=== p1answerKey[j* tsize+2] ){
        thisBox1 = document.getElementById(j* tsize+0);
        thisBox2 = document.getElementById(j* tsize+1);
        thisBox3 = document.getElementById(j* tsize+2);
        thisBox1.style.backgroundColor= "#00ff00";
        thisBox2.style.backgroundColor= "#00ff00";
        thisBox3.style.backgroundColor= "#00ff00";
        return 1;
      }

      //check p1 vertical rows
      else if(playerS[0* tsize+j]=== p1answerKey[0* tsize+j] &&
      playerS[1* tsize+j]=== p1answerKey[1* tsize+j] &&
      playerS[2* tsize+j]=== p1answerKey[2* tsize+j]) {
        thisBox1 = document.getElementById(0* tsize+j);
        thisBox2 = document.getElementById(1* tsize+j);
        thisBox3 = document.getElementById(2* tsize+j);
        thisBox1.style.backgroundColor= "#00ff00";
        thisBox2.style.backgroundColor= "#00ff00";
        thisBox3.style.backgroundColor= "#00ff00";
        return 1;
      }
      //check p1 left diagonals
      else if(playerS[0* tsize+0]=== p1answerKey[0* tsize+0] &&
      playerS[1* tsize+1]=== p1answerKey[1* tsize+1] &&
      playerS[2* tsize+2]=== p1answerKey[2* tsize+2]) {
        thisBox1 = document.getElementById(0* tsize+0);
        thisBox2 = document.getElementById(1* tsize+1);
        thisBox3 = document.getElementById(2* tsize+2);
        thisBox1.style.backgroundColor= "#00ff00";
        thisBox2.style.backgroundColor= "#00ff00";
        thisBox3.style.backgroundColor= "#00ff00";
        return 1;
      }
      //check p1 right diagonals
      else if(playerS[0* tsize+2]=== p1answerKey[0* tsize+2] &&
      playerS[1* tsize+1]=== p1answerKey[1* tsize+1] &&
      playerS[2* tsize+0]=== p1answerKey[2* tsize+0] ){
        thisBox1 = document.getElementById(0* tsize+2);
        thisBox2 = document.getElementById(1* tsize+1);
        thisBox3 = document.getElementById(2* tsize+0);
        thisBox1.style.backgroundColor= "#00ff00";
        thisBox2.style.backgroundColor= "#00ff00";
        thisBox3.style.backgroundColor= "#00ff00";
        return 1;
      }
    //check horiz p2 rows
    else if(playerS[j* tsize+0]=== p2answerKey[j* tsize+0] &&
      playerS[j* tsize+1]=== p2answerKey[j* tsize+1] &&
      playerS[j* tsize+2]=== p2answerKey[j* tsize+2] ){
        thisBox1 = document.getElementById(j* tsize+0);
        thisBox2 = document.getElementById(j* tsize+1);
        thisBox3 = document.getElementById(j* tsize+2);
        thisBox1.style.backgroundColor= "#00ff00";
        thisBox2.style.backgroundColor= "#00ff00";
        thisBox3.style.backgroundColor= "#00ff00";
        return 2;
      }

      //check vertical p2 rows
      else if(playerS[0* tsize+j]=== p2answerKey[0* tsize+j] &&
      playerS[1* tsize+j]=== p2answerKey[1* tsize+j] &&
      playerS[2* tsize+j]=== p2answerKey[2* tsize+j]) {
        thisBox1 = document.getElementById(0* tsize+j);
        thisBox2 = document.getElementById(1* tsize+j);
        thisBox3 = document.getElementById(2* tsize+j);
        thisBox1.style.backgroundColor= "#00ff00";
        thisBox2.style.backgroundColor= "#00ff00";
        thisBox3.style.backgroundColor= "#00ff00";
        return 2;
      }
      //check left p2 diagonals
      else if(playerS[0* tsize+0]=== p2answerKey[0* tsize+0] &&
      playerS[1* tsize+1]=== p2answerKey[1* tsize+1] &&
      playerS[2* tsize+2]=== p2answerKey[2* tsize+2]) {
        thisBox1 = document.getElementById(0* tsize+0);
        thisBox2 = document.getElementById(1* tsize+1);
        thisBox3 = document.getElementById(2* tsize+2);
        thisBox1.style.backgroundColor= "#00ff00";
        thisBox2.style.backgroundColor= "#00ff00";
        thisBox3.style.backgroundColor= "#00ff00";
        return 2;
      }
      //check right p2 diagonals
      else if(playerS[0* tsize+2]=== p2answerKey[0* tsize+2] &&
      playerS[1* tsize+1]=== p2answerKey[1* tsize+1] &&
      playerS[2* tsize+0]=== p2answerKey[2* tsize+0] ){
        thisBox1 = document.getElementById(0* tsize+2);
        thisBox2 = document.getElementById(1* tsize+1);
        thisBox3 = document.getElementById(2* tsize+0);
        thisBox1.style.backgroundColor= "#00ff00";
        thisBox2.style.backgroundColor= "#00ff00";
        thisBox3.style.backgroundColor= "#00ff00";
        return 2;
      }
  }
  return 0;
}
