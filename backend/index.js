const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDb = require('./config/dbConnect');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const statusRoutes = require('./routes/statusRoutes');
const http = require('http');
const initializeSocket = require('./services/socketService');

dotenv.config();

const PORT = process.env.PORT;
const app = express();

// const corsOption = {
//   origin: process.env.FRONTEND_URL,
//   credentials: true,
// };


// ✅ FIXED CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(cors(corsOption));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

connectDb();

const server = http.createServer(app);
const io = initializeSocket(server);

app.use((req, res, next) => {
  req.io = io;
  req.socketUserMap = io.socketUserMap;
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/status', statusRoutes);
app.use("/block", require("./routes/blockRoutes"));


server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
