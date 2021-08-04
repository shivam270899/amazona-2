const express = require("express");
const mongoose = require("mongoose");
//const SocketIO = require("socket.io");
//const http = require("http");
const dotenv = require('dotenv');
const userRouter = require("./routers/userRouter");
const productRouter = require("./routers/productRouter");
const orderRouter = require("./routers/orderRouter");
const path = require("path");
//const { Socket } = require("dgram");

dotenv.config();

async()=>{
   await mongoose.connect(process.env.MONGODB_URL ||  'mongodb://localhost/amazona',{
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
}



const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

 


app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.get('/api/config/paypal', (req, res) => {
    res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
})
app.use((err , req, res, next) => {
    res.status(500).send({message: err.message })
})


if(process.env.NODE_ENV === 'production'){
    app.use('/', express.static('frontend/build'))
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, 'frontend/build/index.html'));
    })
} 



const port = process.env.PORT || 5000;
/*
const httpServer = http.Server(app);
const io = SocketIO(httpServer);
const users = [];

io.on('connection', (socket) => {
    socket.on('disconnect', () => {
        const user = users.find((x) => x.socketId === socket.id);
        if(user) {
            user.online = false;
            console.log('offline', user.name);
            const admin = user.find((x) => x.isAdmin && x.online);
            if(admin){
                io.to(admin.socketId).emit('updateUser', user);
            }
        }
    });
    socket.on('onLogin', (user) => {
        const updatedUser = {
            ...user,
            online: true,
            socketId: socket.id,
            messages: [],
        }
        const existUser = user.find((x) => x._id === updatedUser._id);
        if(existUser){
            existUser.socketId = socket.id;
            existUser.online = true;
        }else{
            users.push(updatedUser);
        }
        console.log('Online', user.name);
    });
    
})

*/


app.listen(port, () => {
    console.log(`serve at http://localhost:${port}`);
});