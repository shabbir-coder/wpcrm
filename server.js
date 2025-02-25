const express = require('express');
const connectDB = require('./connection/db');
const cors = require('cors');
const path = require('path');
const http = require('http');
const routes = require('./api/routes');
const { initializeSocket } = require('./api/middlewares/socket');

require('dotenv').config();

const app = express();
const port = 3008;

connectDB();

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'dist')));

app.use('/api', routes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.get('*', (req, res) => {
   res.redirect('/admin');
});

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

const io = initializeSocket(server);
app.set('io', io);

module.exports = { io };
