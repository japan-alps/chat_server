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
ログイン
-------------------------------------------------*/

    socket.on("user_from_client" , function(data) {
      console.log(data);
      var name;
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
            var content = "insert into users(name) values('"  + data + "');";
            connection.query(content, function (err, results) {
              if(err){
                console.log(err);
              }else{
                console.log("insert");
                callback(null);
              }
            });
          }else{
            //かぶってれば
            console.log("not unique");
            callback(null);
          }
        },
        // id送信
        function(callback) {
          //かぶってなければ
          var content = "select * from users where name ='"  + data + "';";
          connection.query(content, function (err, results) {
            if(err){
              console.log(err);
            }else{
              var id = results[0].id;
              socket.emit('user_from_server', id);
              callback(null);
            }
          });
        }
      ]);
    });

/*------------------------------------------------
画像
-------------------------------------------------*/

    socket.on('img_from_client', function (data) {
      var img = data;
      var base64 = img;

      if (!base64) {
        console.log('fal to parse image');
      }

      var now = new Date().getTime();
      var outputPath = now;
      console.log("outputPath="+outputPath);

      fs.writeFile(
        './' + outputPath,
        new Buffer(base64, 'base64'),
        function (err) {
          console.log(err);
        });
      });

/*------------------------------------------------
動画
-------------------------------------------------*/

      socket.on('movie_from_client', function (data) {
        var img = data;
        var base64 = img;

        if (!base64) {
          console.log('fal to parse image');
        }

        var now = new Date().getTime();
        var outputPath = now;
        console.log("outputPath="+outputPath);

        fs.writeFile(
          './' + outputPath,
          new Buffer(base64, 'base64'),
          function (err) {
            console.log(err);
          });
        });

        /*------------------------------------------------
        json
        -------------------------------------------------*/

        socket.on('json_from_client', function (data) {
          
          console.log(data.name);
          socket.json.emit('json_from_server',{
                name: "hello",
                desc: "world"
           });
          });

        });
      };
