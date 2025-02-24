const express = require('express');
const connectDB = require('./connection/db');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./api/routes');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { initializeSocket } = require('./api/middlewares/socket'); 

require('dotenv').config();
const app = express();
const port = 3015;

connectDB();

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

const server = http.createServer(app);

const io = initializeSocket(server);

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use('/api', routes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

module.exports = { io };
