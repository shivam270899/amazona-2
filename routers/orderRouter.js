const express = require('express');
const expressAsyncHandler = require('express-async-handler');
const mg = require("mailgun-js");
const Order = require('../models/orderModel');
const User  = require('../models/userModel');
const Product = require('../models/productModel');
const jwt = require('jsonwebtoken');

const orderRouter = express.Router();

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

//middleware isAdmin
const isAdmin = (req, res, next) => {
    if(req.user && req.user.isAdmin){
        next();
    }else{
        res.status(401).send({message: 'Invaild Admin Token'});
    }
};

//middleware isSeller
const isSeller = (req, res, next) => {
    if(req.user && req.user.isSeller){
        next();
    }else{
        res.status(401).send({message: 'Invaild Seller Token'});
    }
};

//middleware isAdmin/isSeller
const isSellerOrAdmin = (req, res, next) => {
    if(req.user && (req.user.isSeller || req.user.isAdmin)){
        next();
    }else{
        res.status(401).send({message: 'Invaild Admin/Seller Token'});
    }
};

// To send Mail

const mailgun = () =>  mg({
    apiKey : '4b8bbd5d4dc2701ae7677755f1d3e54b-1d8af1f4-c57ab856',
    domain: 'sandbox49911e6713c34219a2a745fdeaf0635b.mailgun.org',
});

orderRouter.get('/',isAuth, isSellerOrAdmin ,expressAsyncHandler(async(req,res) => {
    const seller = req.query.seller || '';
    const sellerFilter = seller ? {seller} : {};
    const orders = await Order.find({...sellerFilter}).populate('user','name');
    res.send(orders);
}))

orderRouter.get('/summary', isAuth, isAdmin, expressAsyncHandler(async(req, res) => {
    const orders = await Order.aggregate([
        {
            $group : {
                _id: null,
                numOrders: {$sum : 1},
                totalSales: {$sum : '$totalPrice'}//sum of total price in Order
            },
        }
    ]);
    const users = await User.aggregate([
        {
            $group : {
                _id: null,
                numUsers: {$sum : 1},
            },
        }
    ]);
    const dailyOrders = await Order.aggregate([
        {
            $group : {
                _id: { $dateToString: { format: '%Y-%m-%d' , date: '$createdAt'}},   // to keep data in same catgory
                orders: {$sum : 1},
                sales: {$sum : '$totalPrice'}//sum of total price in Order
            },
        },
        { $sort : {_id : 1}}
    ]);
    const productCategories = await Product.aggregate([
        {
            $group : {
                _id: '$category',
                count: {$sum : 1},
            },
        }
    ]);
    res.send({orders, users, dailyOrders, productCategories});

}))

orderRouter.get('/mine', isAuth, expressAsyncHandler(async(req, res) => {
    const orders = await Order.find({ user: req.user._id});
    res.send(orders);
}))

orderRouter.post('/', isAuth ,expressAsyncHandler(async(req, res) => {
    if(req.body.orderItems.length === 0){
        res.status(400).send({message: 'Cart is empty'});
    } else{
        const order = new Order({
            seller: req.body.orderItems[0].seller,
            orderItems: req.body.orderItems,
            shippingAddress: req.body.shippingAddress,
            paymentMethod: req.body.paymentMethod,
            itemsPrice: req.body.itemsPrice,
            shippingPrice: req.body.shippingPrice,
            taxPrice: req.body.taxPrice,
            totalPrice: req.body.totalPrice,
            user: req.user._id,
        });
        const createdOrder = await order.save();
        res.status(201).send({message:'New Order Created', order: createdOrder});
    }
}));

orderRouter.get('/:id', isAuth, expressAsyncHandler(async(req, res)=> {
    const order = await Order.findById(req.params.id).populate('user', 'email name');
    if(order){
        mailgun().messages().send({
            from : 'Amazona <amazona@mg.yourdomain.com>',
            to : `${order.user.name} <${order.user.email}>`,
            subject: `New Order ${order._id}`,
            html: payOrderEmailTemplate(order)
        }, (error, body) => {
            if(error){
                console.log(error);
            }else{
                console.log(body);
            }
        })
        res.send(order);
    }else{
        res.status(404).send({message: 'Order Not Fount'});
    }
}));

const payOrderEmailTemplate = (order) => {
    return `<h1>Thanks for Shopping with us</h1>
    <p> 
    Hi ${order.user.name},</p>
    <p>We have finished processing your order.</P>
    <h2>[order ${order._id}] (${order.createdAt.toString().substring(0,10)})</h2>
    <table>
    <thead>
    <tr>
    <td><strong>Product</strong></td>
    <td><strong>Quantity</strong></td>
    <td><strong align="right">Price</strong></td>
    </tr>
    </thead>
    <tbody>
    ${order.orderItems.map((item) => `
    <tr>
    <td>${item.name}</td>
    <td  align="center">${item.qty}</td>
    <td  align="right"> $${item.price.toFixed(2)}</td>
    </tr>
    `)
    .join('\n')}
    </tbody>
    <tfoot>
    <tr>
    <td colspan="2">Item Price:</td>
    <td align="right">${order.itemsPrice.toFixed(2)}</td>
    </tr>
    <tr>
    <td colspan="2">Tax Price:</td>
    <td align="right">${order.taxPrice.toFixed(2)}</td>
    </tr>
    <tr>
    <td colspan="2">Shipping Price:</td>
    <td align="right">${order.shippingPrice.toFixed(2)}</td>
    </tr>
    <tr>
    <td colspan="2">Total Price:</td>
    <td align="right">${order.totalPrice.toFixed(2)}</td>
    </tr>
    <tr>
    <td colspan="2">Payment Method:</td>
    <td align="right">${order.paymentMethod}</td>
    </tr>
    </tfoot>
    </table>
    <h2> Shipping Address </h2>
    <p>
    ${order.shippingAddress.fullName},</br>
    ${order.shippingAddress.address},</br>
    ${order.shippingAddress.city},</br>
    ${order.shippingAddress.country},</br>
    ${order.shippingAddress.postalCode},</br>
    </P>
    <hr/>
    <p>
    Thank you for shopping with us.
    </P>
    `
}

orderRouter.put('/:id/pay', isAuth, expressAsyncHandler(async(req,res)=>{
    const order = await Order.findById(req.params.id);
    if(order){
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {id: req.body.id, status: req.body.status, update_time: req.body.update_time, email_address: req.body.email_address}; 
        const updatedOrder = await order.save();
        res.send({message: 'Order Paid', order: updatedOrder});
    }else{
        res.status(404).send({message: 'Order Not Found'});
    }
    
}))

orderRouter.delete('/:id', isAuth, isAdmin, expressAsyncHandler(async(req, res) => {
    const order = await Order.findById(req.params.id);
    if(order){
        const deleteOrder = await order.remove();
        res.send({message:'Order deleted', order: deleteOrder});
    }else{
        res.status(404).send({message: 'Order not found'});
    }
}))

// To do order delivery api
orderRouter.put('/:id/deliver', isAuth, isAdmin,expressAsyncHandler(async(req,res)=>{
    const order = await Order.findById(req.params.id);
    if(order){
        order.isDelivered = true;
        order.deliveredAt = Date.now();

        const updatedOrder = await order.save();
        res.send({message: 'Order Delivered', order: updatedOrder});
    }else{
        res.status(404).send({message: 'Order Not Found'});
    }
    
}))
 






module.exports = orderRouter;