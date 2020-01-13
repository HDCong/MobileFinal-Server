var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
var mysql = require('mysql')
var db = require('./db')

app.get('/', (req, res) => {
    res.json([{ '1712304': 'Hoàng Đức Công' }, { '1712168': 'Trần Lê Bá Thịnh' }])
})
app.get('/question', (req, res) => {

})
server.listen(process.env.PORT || 8515);
io.on('connection', function (socket) {
    console.log('a user connected');
    console.log(socket.id)
    socket.on('getRoomID', function () {
        var query1 = 'SELECT RO.roomID FROM RoomOnline RO WHERE RO.isWaiting = 1'
        var query2 = ' HAVING (SELECT COUNT(*) FROM clientInRoom CL WHERE CL.roomID = RO.roomID) < 4 ORDER BY RO.roomID ASC'
        db.query(query1 + query2, (err, result) => {
            if (err) {
                throw err;
                console.log(err)
            }
            else {
                console.log(result)
                socket.emit('RoomID', { roomid: result });
                console.log((result[0].roomID.toString()))
                // socket.join(result[0].roomID.toString())
            }
        })
    })
    socket.on('joinRoom', (objectRoom) => {
        console.log(objectRoom)
        db.query('SELECT COUNT(*) as c FROM clientInRoom cl WHERE cl.roomID = ?', [objectRoom.roomID], (error, results) => {
            if (error) {
                // console.log(error)
                throw error;
            }
            else {
                console.log(results)
                if (results[0].c < 4) {
                    var query1 = 'INSERT INTO clientInRoom(clientName, roomID) values (\''
                    var query2 = objectRoom.name.toString() + '\', ' + objectRoom.roomID + ')'
                    console.log(query1 + query2)
                    db.query(query1 + query2, (err, results) => {
                        if (err) {
                            throw err;
                            console.log(err)
                        }
                        else {
                            console.log(results)
                            if (results.affectedRows == 1) {
                                socket.join(objectRoom.roomID)
                            }
                        }
                    })
                }
                else {
                    io.to(socket.id).emit('errorOnAction', { reason: 'Phòng đã đủ 4 người' })
                }
            }
        })
    })
    socket.on('client-create', (clientName) => {
        console.log('create room neks')
        // Do with query when had database
        db.query('INSERT INTO RoomOnline(isWaiting) values (1)', (err, results) => {
            if (err) {
                // console.log(err)
                // Do something. to notify user
                throw err
            }
            else {
                console.log(results)
                if (results.affectedRows == 1) {
                    console.log(socket.id)
                    console.log(results.insertId)
                    var query1 = 'INSERT INTO clientInRoom(clientName, roomID) values ('
                    var query2 = '\''+clientName +'\'' +',' + results.insertId+')'
                    db.query(query1 + query2,(err,results)=>{
                        if(err){
                            throw err
                        }
                        else{
                            io.to(socket.id).emit('CreatedRoom', { roomid: results.insertId });
                        }
                    })
                }
            }
        })
    })
    socket.on('chat', (objectChat) => {
        console.log(objectChat.roomID)
        console.log(objectChat.user)
        console.log(objectChat.Message)
        console.log(typeof (objectChat.roomID))
        socket.to(objectChat.roomID).emit('test', { user: objectChat.user, message: objectChat.Message })
        // io.to('3').emit('test','socket send except sender')
    })
    socket.on('start-game', (roomID) => {
        console.log('Start game')
        db.query('SELECT * FROM Question qt ORDER BY RAND() LIMIT 1', (err, results) => {
            if (err) {
                // console.log(err)
                throw err

            }
            else {
                console.log(results)
                socket.to(roomID).emit('Question', { status: 1, quest: results[0].urlPicture, ans: results[0].solution })
                db.query('UPDATE RoomOnline ro SET isWaiting = 0 WHERE ro.roomID=?', [roomID], (err, results) => {
                    if (err) {
                        // console.log(err)
                        throw err
                    }
                    else {
                        console.log(results)
                        socket.to(roomID).emit('question', { question: results[0].urlPicture, sol: results[0].solution });
                    }
                })
            }
        })
    })
    socket.on('receive', (objectPoint) => {
        // object point : room id, username, point plus
        socket.to(objectPoint.roomID).emit('updatePoint', { user: objectPoint.username, point: objectPoint.point })

    })
    socket.on('getQuestion', () => {
        console.log('get question nek')
        db.query('SELECT * FROM Question qt ORDER BY RAND() LIMIT 1', (err, results) => {
            if (err) {
                throw err
                console.log(err)

            }
            else {
                console.log(results[0])
                io.to(socket.id).emit('QuestionNek', { url: results[0].urlPicture, sol: results[0].solution })
            }
        })
    })
    socket.on('disconnect', function (socket) {
        console.log('a user disconnected')
    })

});