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
        console.log('20 : vao get room id')
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
                // socket.join(result[0].roomID.toString())
            }
        })
    })

    socket.on('joinRoom', (objectRoom) => {
        console.log('37 : vao join room id')
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
                                io.to(socket.id).emit('joinedRoom', { ok: 'OK' });
                                socket.join(objectRoom.roomID)
                                db.query('SELECT cl.clientName FROM clientInRoom cl WHERE cl.roomID = ?', [objectRoom.roomID], (err, results2) => {
                                    if (err) throw err;
                                    else {
                                        console.log(results2)
                                        console.log(objectRoom.roomID)
                                        io.to(objectRoom.roomID).emit('listPlayer', { list: results2 })
                                    }
                                })
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
                    var query2 = '\'' + clientName + '\'' + ',' + results.insertId + ')'
                    console.log(query1 + query2)
                    db.query(query1 + query2, (err, result) => {
                        if (err) {
                            throw err
                        }
                        else {
                            socket.join(results.insertId)
                            io.to(socket.id).emit('CreatedRoom', { roomid: results.insertId });
                        }
                    })
                }
            }
        })
    })
    socket.on('chat', (objectChat) => {
        console.log('134 : vao chat recei ')

        console.log(objectChat.roomID)
        console.log(objectChat.user)
        console.log(objectChat.Message)
        console.log(typeof (objectChat.roomID))
        socket.to(objectChat.roomID).emit('test', { user: objectChat.user, message: objectChat.Message })
        // io.to('3').emit('test','socket send except sender')
    })
    socket.on('start-game', (roomID) => {
        console.log('Start game')
        db.query('SELECT * FROM Question qt ORDER BY RAND() LIMIT 1', (err, result) => {
            if (err) {
                throw err
            }
            else {
                console.log(result)
                db.query('UPDATE RoomOnline ro SET isWaiting = 0 WHERE ro.roomID=?', [roomID], (err, results) => {
                    if (err) {
                        throw err
                    }
                    else {
                        console.log(results)
                        io.to(roomID).emit('question', { url: result[0].urlPicture, sol: result[0].solution});
                    }
                })
            }
        })
    })

    socket.on('receive', (objectPoint) => {
        console.log('134 : vao get recei ')

        // object point : room id, username, point plusc
        console.log( objectPoint.username)
        console.log( objectPoint.point)
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

    socket.on('updateList', (roomid,str) => {
        console.log(' vao update list')
        console.log(str)
        console.log(socket.id)

        db.query('SELECT cl.clientName FROM clientInRoom cl WHERE cl.roomID = ?', [roomid], (err, results2) => {
            if (err) throw err;
            else {
                console.log(results2)
                io.to(socket.id).emit('listPlayer', { list: results2 })
            }
        })
    })

    socket.on('disconnect', function (socket) {
        console.log('a user disconnected')
    })

});