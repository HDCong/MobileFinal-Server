# MobileFinal - Server

Capture word is a game android. Base on game "Catch the word".

With two mode: offline and online. Offline mode like other games. But with online mode, users can compete, interact with others in real time

This is the server part of my final project of Mobile Development course at school

Using NodeJs, Socket.IO module and connect to MySQL to make a real-time server.

Deployed to Heroku

## Functional

1. Receive connection requests from clients

2. Events handling:
    * Send link image and solution for client 
    * Send list available room for playing online
    * Send message to people in the same room
    * Update point to every player in same room
    

