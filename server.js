var express = require('express');
var path = require('path');
var app = express();
app.use(express.static(__dirname));
app.get('/',function (req,res) {
    //resolve当前server目录下开始查找index.html，然后拼接成绝对路径
   res.sendFile(path.resolve('index.html'))
});
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var messages =[];
//存放用户名和socket的对应关系
var sockets = {};
io.on('connection',function (socket) {
    var username ;
    io.emit('messages',messages);
    socket.send({username:'系统',content:'请输入昵称',createAt:new Date().toLocaleString()});

    socket.on('join',function(room){
        if(room){
            currentRoom = room;
            socket.join(room);
            //每当客户端连接上来的时候，向客户端发送一个消息
            socket.emit('messages',messages.filter(function(message){
                return message.room == currentRoom;
            }));
        }else{
            socket.emit('messages',messages.filter(function(message){
                return !message.room;
            }));
        }

    });


    socket.on('message',function (msg) {
        var regex = /^@(.+?)\s(.+)$/;
            if(username){
                var result = msg.match(regex);
                if(result){
                    var toUser  = result[1];
                    var content = result[2];
                    var toSocket = sockets[toUser];
                    if(toSocket){
                        toSocket.send({username:'@'+toUser,content:content,createAt:new Date().toLocaleString()})
                    }else{
                        socket.send('message',{username:'系统',content:'你私聊的用户不存在',createAt:new Date().toLocaleString()})
                    }
                }
               else{
                    var user = {username:username,content:msg,createAt:new Date().toLocaleString()};
                    messages.push(user);
                    io.emit('message',user);
                }
            }
            else{
                //判断此用户名是否有人已经用过了
                if(sockets[msg]){
                    io.emit('message',{username:'系统',content:`系统名已经被占用请从新输入`,createAt:new Date().toLocaleString()})
                }
                else {
                    username=msg;
                    //存放用户名和socket的对应关系
                    sockets[username] = socket;
                    io.emit('message',{username:'系统',content:`欢迎${username}加入聊天室`,createAt:new Date().toLocaleString()});
                }
            }
    });
});
server.listen(8080);