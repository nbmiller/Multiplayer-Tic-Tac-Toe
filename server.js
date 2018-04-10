
var express = require('express');
var app = express();
var serverIndex = require('serve-index');
var http = require('http');
var bodyParser = require("body-parser");
var dateFormat = require('dateformat');
var socketIO = require('socket.io');
var path = require('path');
// var server = http.createServer(app).listen(8080);
var port = process.env.PORT || 8080;
var server = http.createServer(app).listen(port);
var fs = require('fs');
var io = require('socket.io')(server);
// const wss = new SocketServer({ server });

// Schema is a constructor
var mongoose = require('mongoose');
var mongodb = require('mongodb');

mongoose.connect("mongodb://root:root@ds014118.mlab.com:14118/asn4");
// mongoose.connect("mongodb://nick:nick@ds014118.mlab.com:14118/asn4");
// mongoose.connect("mongodb://root:root@ds064628.mlab.com:64628/fproj");

// mongoose.connect("mongodb:marinacameron:checkers07@ds237989.mlab.com:37989/cmpt218a4");
var db = mongoose.connection;


app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

// var port = process.env.PORT || 8080;//15014;
// var users = [];

/*
** SCHEMA
** STUFF
*/
var Schema = mongoose.Schema;
// instantiate the constructor

/*
** User Schema
*/
var userSchema= new Schema({
  username:{type: String},//, unique: true},
  password:{type: String},
  socketID:{type: String}, //current socket assigned to player
  playerNum:{type: Number}, //current player Number

  fname:{type: String},
  lname:{type: String},
  age: {type: Number},
  gender:{type: String},
  email:{type: String},

  // gameStarted: {type: Date},
  wins: {type: Number, default: 0},
  losses: {type: Number, default: 0},
  ties: {type: Number, default: 0},
  loggedIn: {type: Boolean, default: false}, //set to true on login,
                                              //prevent dupe user login
  gamesPlayed: [{                 //Game IDs that user played
    gameID: {type: String}
  }]
});

/*
** Game Schema
*/
var gameSchema= new Schema({
  // game: {
    status: {type:Boolean, default: true},
    startTime: {type: Date},
    winner: {type: String},
    loser: {type: String},
    tie: {type:Boolean, default: false},
    numMoves: {type: Number},
    players: [{
      playerName: {type: String}
    }],
    // sockets: [{                           //may not be necessary
    //   sID: {type: String}
    // }],
    numPlayers: {type: Number}
  });

// create a new model
var User = mongoose.model('user', userSchema);
var Game = mongoose.model('game', gameSchema);


/*
** On Database Connection
** logout users that may have been logged in when server was closed
*/
db.once('open', function(){
  var resultArray= [];//[];
  var query =  { loggedIn: true};
  User.find(query, function(err, users) {
    users.forEach(function(user, err){
      if (err)   console.log(err);
      query = {'username': user.username};
      User.findOneAndUpdate(query, {loggedIn: false},
         {upsert:false}, function(err, doc){
        if (err)
          console.log(err);
        if (!doc)
         console.log("Unknown Player logged in was NOT logged out on startup");
        // else{
        //   console.log(doc.username, " logged in previously was logged out successfully");
        // }
      });
    });
  });
console.log('connection success');
});

/*
** SOCKET
** STUFF
*/
var clients = 0;  //num clients
// var prevGameID =null;
var pSockIDs = new Array(); //Socket IDs Connected Array
var pNames = new Array(); //Player names Connected
var firstRun = true;
/*
** On Socket Connection
*/
// wss.on('connection', function(socket){
io.on('connection', function(socket){
  console.log('new connection', socket.id);
  clients++;
  console.log('Clients now at', clients);

  /*
  ** On Chat Send Message
  */
  socket.on('sendMessage', function(data){
    // console.log(data.gameID, "is the game ID the button press occured");
    // console.log(io.sockets.in(data.gameID).length, "is the number of users in the room"  );``
    io.sockets.in(data.gameID).emit('messageSent', data);  //Broadcast to all sockets in room
    // wss.sockets.in(data.gameID).emit('messageSent', data);
  });

  /*
  ** On Get Online User Count
  */
  socket.on('getOnlineUserCount', function(data){
    // console.log(data.gameID, "is the game ID the button press occured");
    // console.log(io.sockets.in(data.gameID).length, "is the number of users in the room"  );``
    // io.sockets.in(data.gameID).emit('messageSent', data);  //Broadcast to all sockets in room
    socket.emit('gotOnlineUserCount', {clients: clients, inGame: pNames.length });
    // wss.sockets.in(data.gameID).emit('messageSent', data);
  });

  /*
  ** On Socket Join Room
  */
  socket.on('join', function(data){
    // io.broadcast.to(socket.gameID).emit('bPress', data);
    var count=0;
    // console.log(data.gameID, "is the game ID socket is trying to join");
    socket.join(data.gameID);

    query = {'username': data.pName};
    User.findOneAndUpdate(query, {socketID: socket.id, loggedIn: true},
       {upsert:false}, function(err, doc){
      if (err)
        console.log(err);
      if (!doc)
       console.log(" Socket not found in DB on join ");
      else{
        // console.log(doc.socketID, " found in DB on join ");
        var playNum = doc.playerNum;
        var username = doc.username;
        socket.playNum = playNum;
        socket.emit('joinComplete', {gameID: data.gameID, playerNum: playNum, username: username});
      }
    });
  });

  /*
  ** On Button Press
  */
  socket.on('bPress', function(data){
    // console.log(data.gameID, "is the game ID the button press occured");
    // console.log(io.sockets.in(data.gameID).length, "is the number of users in the room"  );``
    io.sockets.in(data.gameID).emit('bPress', data);  //Broadcast to all sockets in room
    // wss.sockets.in(data.gameID).emit('bPress', data);
  });

  /*
  ** On Login
  */
  socket.on('login', function(data){
    var pName = data.userName;
    socket.userName = pName;  //set socket to have username variable
    // console.log(pName, "log in attempt");
    //push onto arrays
    // pSockIDs.push(socket.id);
    // pNames.push(pName);


    query = {'username': pName};
    User.findOneAndUpdate(query, {loggedIn: true, socketID: socket.id},
       {upsert:false}, function(err, doc){
      if (err)
        console.log(err);
      if (!doc)
       console.log(pName, " NOT  logged in ");
      // else{
        // console.log(pName, " is logged in ");
        // return fs.createReadStream(__dirname + '/secure/game.html');
        // socket.emit('login', data);
      // }
    });
  });

  /*
  ** On Logout
  */
socket.on('logout', function(data){
  query = {'username': data.username};

  // query = {'username': pName};
  pSocket= socket.id;
    User.findOneAndUpdate(query, {loggedIn: false},
       {upsert:false}, function(err, doc){
      if (err)
        console.log(err);
      // if (!doc)
      //  console.log(data.username, " NOT LOGGED OUT PROPERLY");
      else{
        // console.log(doc.username, " is logged out ");
        // return fs.createReadStream(__dirname + '/secure/game.html');
        // socket.emit('matchMakeComplete', data);
        if(pSockIDs.length > 0 && pNames.length > 0){
          pSockIDs.pop(pSocket);
          pNames.pop(doc.username);
        }
      }
    });
});

  /*
  ** On changeTurn
  */
  socket.on('changeTurn', function(data){
    // console.log(data.turnCount, "is the Turn On Server, Entering ChangeTurn");
    socket.emit('changeTurn', data);
  });

  /*
  ** On One Player Quit Game
  */
  socket.on('onePlayerQuit', function(data){
    // console.log(data.turnCount, "is the Turn On Server, Entering ChangeTurn");
    query = {'username': data.winner};

    // query = {'username': pName};
    // pSocket= socket.id;
      User.findOne(query, function(err, doc){
        if (err)
          console.log(err);
        if (!doc)
         console.log(data.winner, " NOT FOUND AFTER OTHER PLAYER QUIT");
        else{
              var sockID=doc.socketID;
              // console.log(data.winner, " NOT FOUND AFTER OTHER PLAYER QUIT");
          // console.log(doc.username, "found and quit button about to be updated");
              socket.to(sockID).emit('onePlayerQuit', data);
        }


    });
    // socket.to(<socketid>).emit('hey', 'I just met you');
    // io.sockets.in(data.gameID).emit('onePlayerQuit', data);
  });

  /*
  ** On One Player Quit Game
  */
  socket.on('popFromActivePlayers', function(data){
    pNames.pop(data.winner);
  });

  /*
  ** On getOtherPlayer
  */
  socket.on('getOtherPlayer', function(data){
    var query = {'_id': data.gameID};

    Game.findOne(query , function(err, doc){
      if (err ) console.log(err);
      if(!doc)//|| doc.password !== pass)
       console.log(data.gameID, "UNSUCCESSFULLY GOT OTHER PLAYER");
       else{
         pNames.pop(data.thisPlayer);
         // console.log(doc.players.length, "is length of player array to find other player");
         for(var i = 0;i< doc.players.length;i++){
           // console.log(doc.players[i].playerName, "is current player");
           if(doc.players[i].playerName !== data.thisPlayer){
             var otherPlayer = doc.players[i].playerName;
             console.log(otherPlayer, "Got Other player that isn't a quitter");
             socket.emit('getOtherPlayer', {thisPlayer: data.thisPlayer
               ,otherPlayer: otherPlayer, gameID: data.gameID});
           }
         }
       }
    });
  });


  /*
  ** On Match Complete
  */
  socket.on('matchComplete', function(data){
    var winnerName = data.winnerName;
    var solutionNum = data.winner;
    var gameID= data.gameID;
    var update;
    if(firstRun){
      firstRun=false;
    // console.log(gameID, "Attempting Completed Game Update...");
    var query = {'_id': gameID};
    if(solutionNum === 0){
      update= {'status': false,'tie': true, 'numMoves': data.turnCount};
    }
    else {
      update = {'status': false, 'winner': winnerName,
      'loser': data.loserName,
      'numMoves': data.turnCount}
    }

    Game.findOneAndUpdate(query, update,
       {upsert:false}, function(err, doc){
      if (err)
        console.log(err);
      if (!doc)
       console.log(gameID, "COMPLETED GAME NOT UPDATED");
      else{
        console.log(gameID, "Completed Game Updated");

        //update winner
        if(solutionNum !== 0){
          query =  {'username': winnerName};
          update= {$inc : {'wins' : 1}};
        }
        else{
          query =  {'username': winnerName};
          update= {$inc : {'ties' : 1}};
        }
          User.findOneAndUpdate(query, update,
             {upsert:false}, function(err, doc){
            if (err)
              console.log(err);
            if (!doc)
             console.log(winnerName, " WINNER NOT UPDATED PROPERLY");
            else{
              console.log(winnerName, " win/ tie updated");

              //update loser
              if(solutionNum !== 0){
                query =  {'username': data.loserName};
                update= {$inc : {'losses' : 1}};
              }
              else{
                query =  {'username': data.loserName};
                update= {$inc : {'ties' : 1}};
              }
                User.findOneAndUpdate(query, update,
                   {upsert:false}, function(err, doc){
                  if (err)
                    console.log(err);
                  if (!doc)
                   console.log(data.loserName, " LOSER NOT UPDATED PROPERLY");
                  else{
                    console.log(doc.username, " loss/ tie updated");
                    if(data.matchEndedEarly === true){
                      socket.emit('matchEndedEarly', {gameID: gameID, winner:winnerName})
                    }
                  }
                });
            }
          });
          //emit play again signal

      }
    });
  }
  });

  /*
  ** On MatchMake
  */
  socket.on('matchMake', function(data){

    var thisSocket = socket.id;
    // console.log("Current Socket ID: ", socket.id);
    var thisUser = data.userName;
    // console.log("Current Username: ", data.userName);


    // //push onto arrays
    pSockIDs.push(thisSocket);
    pNames.push(thisUser);

    //if there is an even number of clients and sockets waiting to be matched is at least 2
    // if(clients %2 ==0 && pSockIDs.length > 1){
    if(pSockIDs.length %2 ==0 && pSockIDs.length !== 0){//////////////////////
      var prevSocket = pSockIDs[pSockIDs.length -2];
      // console.log("Previous Socket ID: ", prevSocket);
      var prevUser = pNames[pNames.length -2];
      // console.log("Previous Username: ", prevUser);

       var startDate =Date.now();

       var thisGame = new Game({
         startTime: startDate,
         numPlayers: 2
         });

       thisGame.save(function(error) {
         if (error) { console.error(error); }
         else{
         console.log("Game Created: ", thisGame._id);
         Game.findOneAndUpdate({_id: thisGame._id} ,{$push:{players:
           [{playerName:prevUser},{playerName:thisUser}]}}
          ,function(error){
           if (error) {
           console.error(error);
           }
           else{

             // console.log(prevSocket, " is the prev socket ID (before)");
             var prevSObj =io.of('/').connected[prevSocket];

             // console.log(prevSObj.id, " is the prev socket ID ");
             thisGameID = thisGame._id;
             socket.gameID = thisGameID; //set socket to game ID
             // console.log(socket.gameID, " is the set socket Game ID ");
             prevSObj.gameID = thisGameID; //set prev socket to game ID
             // console.log(prevSObj.gameID, " is the prev set socket Game ID ");
             var userName;
             //make both sockets join room
             // socket.join(thisGameID);
             // prevSObj.join(thisGameID);
             var playerNumber = Math.floor((Math.random() * 2) + 1);

             var query;
              query = {'username': thisUser};
              userName = thisUser;

               User.findOneAndUpdate(query, {$push: {gamesPlayed: thisGame._id}, playerNum: playerNumber},
                  {upsert:false}, function(err, doc){
                 if (err)
                   console.log(err);
                 // if (!doc)
                 //  console.log(userName, " NOT ADDED to game ", thisGame._id);
                 else{
                   console.log(userName, " is added to game ", thisGame._id);
                   pNames.push(userName);
                   if(playerNumber ===1)
                    playerNumber = 2;
                    else {
                      playerNumber = 1;
                    }

                   query = {'username': prevUser};
                   userName = prevUser;
                   User.findOneAndUpdate(query, {$push: {gamesPlayed: thisGame._id}, playerNum: playerNumber},
                      {upsert:false}, function(err, doc){
                     if (err)
                       console.log(err);
                     // if (!doc)
                     //  console.log(userName, " NOT ADDED to game ", thisGame._id);
                     else{
                       console.log(userName, " is added to game ", thisGame._id);
                       // pSockIDs.push(pSocket);
                       pNames.push(userName);
                       // return fs.createReadStream(__dirname + '/secure/game.html');
                       // socket.emit('matchMakeComplete', data);
                     }
                   });
                 }
                 // io.to(thisGameID)
                 // pSockIDs.push(pSocket);
                 // pNames.push(doc.username);
                 socket.emit('matchMakeComplete', {gameID: thisGameID});
                 prevSObj.emit('matchMakeComplete', {gameID: thisGameID});
               });
             }
           });
        }
      });
    }
    else {
      socket.emit('waitForPlayers');
    }
  });

  /*
  ** On Socket Disconnect
  */
  socket.on('disconnect', function(){ //add loss if player disconnect before game is over

    clients--;
    firstRun = true;
    var pSocket = socket.id;
    console.log('Disconnect event, Clients now at ', clients);

    query = {'socketID': pSocket};

    // query = {'username': pName};
      User.findOneAndUpdate(query, {loggedIn: false},
         {upsert:false}, function(err, doc){
        if (err)
          console.log(err);
        if (!doc)
         console.log(pSocket, "Closed");
        else{
          // console.log(doc.username, " is logged out ");
          if(pSockIDs.length > 0 && pNames.length > 0){
            pSockIDs.pop(pSocket);
            pNames.pop(doc.username);
          }
        }
      });

    //socket.emit('clientChange',clients);
    socket.broadcast.emit('clientChange',clients);
  });

  socket.emit("message", "You're connected!!!");
});


/*
** POSTS & GETS
** STUFF
*/
var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm','html'],
  index: "login.html"
}

app.use('/', function(req,res,next){
  console.log(req.method, 'request:', req.url, JSON.stringify(req.body));
  next();
});

app.use('/', express.static('./', options));

/*
** New User Register
*/
app.post('/register', function(req,res,next){
  // console.log(JSON.stringify(req.body));
  var userName = req.body.username;
  console.log("Trying to register ",userName);
  var password = req.body.password;
  var fName = req.body.fname;
  var lName = req.body.lname;
  var gender = req.body.gender;
  var age = req.body.age;
  var email = req.body.email;
  // var date = Date.now();//dateFormat(new Date(), "yyyy-mm-dd h:MM:ss");//(Date.now()).getTimezoneOffset();

  var query = {'username': userName};

  User.findOne(query, function(err, docs) {
    if (err)
      console.log(err);
    if (docs)              //if user exists
      res.sendFile('userExistsError.html' , { root : __dirname});

    else{                                 //If username doesn't exist aslready
      var thisUser = new User({           //create user
        username:userName,
        password:password,

        fname:fName,
        lname:lName,
        age: age,
        gender:gender,
        email:email
      });
      thisUser.save(function(error) {             //save user
        if (error)
        console.log(error);
        else {
          console.log("Added User: ", userName);
          res.sendFile('login.html' , { root : __dirname});
          }
      });
    }
    });
  });

/*
** Get Data
*/
app.get('/data', function(req,res,next){
  var resultArray= [];//[];
  User.find({}, function(err, users) {
    users.forEach(function(user, err){
      if (err)   console.log(err);
      resultArray.push(user);
    });
    // res.render('viewHistory.html', {items: resultArray});
    res.send(resultArray);
  });
});

/*
** Player Login
*/
app.post('/login', function(req,res,next){
  // console.log(JSON.stringify(req.body));
  var user = req.body.user;
  // console.log(user);
  var pass = req.body.pass;
  // console.log(pass);
  //if username and password are correct and user not already logged in
  var query =  {username: user, password: pass, loggedIn: false};

  User.findOne(query , function(err, doc){
    if (err ) console.log(err);
    if(!doc)//|| doc.password !== pass)
     res.sendFile('incorrectLogin.html' , { root : __dirname});
     else
     res.sendFile('secure/viewHistory.html' , { root : __dirname});

  });                                           //////////////Put socket here?

});

/*
** Redirect to View History
*/
// app.get('/viewHistory', function(req,res,next){
//   res.sendFile('./secure/viewHistory.html' , { root : __dirname});
// });


/*
** Start New Game                     //may need socket work with passing game ID
*/
// app.post('/startGame', function(req,res,next){
//       res.sendFile('secure/game.html' , { root : __dirname});
//     // });
//
// });
//
// app.get('/game', function(req,res,next){
//       res.sendFile('secure/game.html' , { root : __dirname});
// });


/*
** Stop Check-in
*/
app.post('/stopCheck', function(req,res,next){
  // console.log(JSON.stringify(req.body));
    var checkID = req.body.hiddenName;
    console.log("Stopping Check-In: ", checkID);

    var query = {'checkinName': checkID};
  // req.newData.username = req.user.username;
  CheckIn.findOneAndUpdate(query, { status: false }, function(err, doc){
      if (err) return res.send(500, { error: err });
      console.log("Stopped Check-In: ", checkID);
  });
    res.sendFile('secure/viewHistory.html' , { root : __dirname});
});


  /*
  ** Delete User From Check-in
  */
  app.post('/deleteUser', function(req,res,next){
    // console.log(JSON.stringify(req.body));
    var checkID = req.body.checkID;
    var userName = req.body.userName;

    console.log("Deleting User: ", checkID, userName);

    var query = {'checkinName': checkID};
    var newUser = {
      'name':userName,
      'checkinName': checkID
    };

    // req.newData.username = req.user.username;
    CheckIn.findOneAndUpdate(query,  {$pull: {users: newUser}} , function(err, doc){
        if (err) return res.send(500, { error: err });
        console.log("Deleted User: ", userName);               //Change this so when status==false it says user not added
    });
                //add check if check in already exists

    res.sendFile('secure/deleteMSG.html' , { root : __dirname});
  });
// http.createServer(app).listen(port);
// console.log('running on port',port);
