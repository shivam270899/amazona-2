const express = require("express");
const multer = require("multer");

const uploadRouter = express.Router();

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename(req, file, cb) {
    cb(null, `${Date.now()}.jpg`);
  },
});

const upload = multer({ storage });


//middleware

const isAuth = (req, res, next) => {
    const authorization = req.headers.authorization;
    if(authorization){
        const token = authorization.slice(7, authorization.length);
        jwt.verify(token, process.env.JWT_SECRET || 'something', (err, decode)=>{
            if(err){
                res.status(401).send({message: 'Token is Invalid'})
            }else{
                req.user= decode;
                next();
            }
        })
    }
    else{
        res.status(401).send({message: 'No Token'});
    }
};

uploadRouter.post('/', isAuth, upload.single('image'), (req, res) => {
  res.send(`/${req.file.path}`);
});
