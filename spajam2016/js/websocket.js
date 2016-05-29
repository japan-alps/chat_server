/*------------------------------------------------
ライブラリ読み込み
-------------------------------------------------*/
var socketIO   = require('socket.io');
var mysql = require('mysql');
var async = require('async');
var fs = require('fs');
var settings = require('./settings');

/*------------------------------------------------
データベース設定
-------------------------------------------------*/
var connection = mysql.createConnection({
  host     : settings.db_host,
  database : settings.db,
  user     : settings.db_user,
  password : settings.db_pass
});

/*------------------------------------------------
socket.io
-------------------------------------------------*/

exports.init = function(app){

  io = socketIO.listen(app);
  io.sockets.on("connection" , function(socket) {
    console.log("connected");

    /*------------------------------------------------
    部屋を作る
    -------------------------------------------------*/

    socket.on("create_room" , function(data) {
      console.log(data);
      var judge;

      async.series([
        //かぶりがないか検索
        function(callback) {
          var content = "select * from users where name ='"  + data + "';";
          connection.query(content, function (err, results) {
            if(err){
              console.log(err);
            }else{
              if(results == ""){
                //かぶってなければ
                console.log("1");
                jubge = 0;
                callback(null);
              }else{
                //かぶってれば
                jubge = 1;
                callback(null);
              }
            }
          });
        },
        // id発行
        function(callback) {
          if(jubge == 0){
            //かぶってなければ
            var content = "insert into users(name,role,point,socketid) values('"  + data + "'," + 0 + "," + 0 + ",'" + socket.id + "');";
            connection.query(content, function (err, results) {
              if(err){
                console.log(err);
              }else{
                console.log("insert");
                socket.emit('created_c', '0');
                callback(null);
              }
            });
          }else{
            //かぶってれば
            console.log("not unique");
            socket.emit('not_created_c', '1');
            callback(null);
          }
        }
      ]);
    });


    /*------------------------------------------------
    部屋に入る
    -------------------------------------------------*/

    socket.on("join_room" , function(data) {
      console.log(data);
      console.log("join");
      var judge;

      async.series([
        function(callback) {
          var content = "select * from users where name ='"  + data + "';";
          connection.query(content, function (err, results) {
            if(err){
              console.log(err);
            }else{
              if(results == ""){
                //かぶってなければ
                jubge = 0;
                callback(null);
              }else{
                //かぶってれば
                jubge = 1;
                callback(null);
              }
            }
          });
        },
        // id発行
        function(callback) {
          if(jubge == 0){
            //かぶってなければ
            var content = "insert into users(name,role,point,socketid) values('"  + data + "'," + 1 + "," + 0 + ",'" + socket.id + "');"
            connection.query(content, function (err, results) {
              if(err){
                console.log(err);
              }else{
                console.log("insert");
		console.dir(data);
                callback(null);
              }
            });
          }else{
            //かぶってれば
            console.log("not unique");
            socket.emit('not_created_j', '1');
            callback(null);
          }
        },
       function(callback){
           if(jubge == 0){
            var content = "select name from users where role =  1;";
            connection.query(content, function (err, results) {
              if(err){
                console.log(err);
              }else{
                console.log("select");
                var result = Array();
                for(var i = 0;i < results.length;i++){
                  result[i] = results[i].name;
                }
                socket.emit('created_j',result);
                socket.broadcast.emit('created_j', result);
                callback(null);
              }
            });
          }else{
            callback(null);
         }
        }  
      ]);
    });


    /*------------------------------------------------
    memberを送る
    -------------------------------------------------*/

    socket.on("member_request" , function(data) {
      var content = "select name from users where role =  1;";
      connection.query(content, function (err, results) {
        if(err){
          console.log(err);
        }else{
          var result = Array();
          for(var i = 0;i < results.length;i++){
             result[i] = results[i].name;
          }
          console.log(result);
          socket.emit('member_response', result);
          socket.broadcast.emit('member_response', result);
          console.log("end");
        }
      });
    });

    /*------------------------------------------------
    問題作成
    -------------------------------------------------*/

    socket.on("question_from_client" , function(data) {
      var content = "select socketid from users;";
      connection.query(content, function (err, results) {
        if(err){
          console.log(err);
        }else{
          console.log("insert_question");
          socket.broadcast.emit("question_from_server",data);         
          socket.emit("question_from_server", data);
        }
      });
    });

    /*------------------------------------------------
    ストリームを送る
    -------------------------------------------------*/

    socket.on("send_stream" , function(data) {
      var content = "select * from users where role =" + 0 + ";";
      connection.query(content, function (err, results) {
        if(err){
          console.log(err);
        }else{
          console.log("send");
          console.log(data.name);
          var img = data.img;
          io.to(results[0].socketid).emit('receive_stream', {
            name: data.name,
             img: img
         });
        }
      });
    });

    /*------------------------------------------------
    正解を送る
    -------------------------------------------------*/

    socket.on("send_answer" , function(data) {
      var Arr = Array();
      var content = "select * from users where role =" + 1 + ";";
      connection.query(content, function (err, results) {
        if(err){
          console.log(err);
        }else{
          for(var i = 0;i < results.length;i++){
            Arr[i] = new Array();
            Arr[i]["id"] = data[i].id;
          }
        }
      });
    });
　
    /*------------------------------------------------
     全員提出
    -------------------------------------------------*/
    var co = 0

    socket.on("finish" , function(data) {
      var Arr = Array();
      console.log("finish");
      var content = "select * from users where role = 1;";
      connection.query(content, function (err, results) {
        if(err){
          console.log(err);
        }else{
          co = co + 1;
          if(co == results.length + 1){
            socket.emit("finish2", "0");
            socket.broadcast.emit("finish2", "0");
         }
        }
      });
    });


  });
};
