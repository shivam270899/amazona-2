const express = require('express');
const route = express.Router();
const Customer = require('../models/customer')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const isAuth = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (authorization) {
        const token = authorization.slice(7, authorization.length);
        jwt.verify(token, process.env.JWT_SECRET || 'xyz', (err, decode) => {
            if (err) {
                res.status(401).send({
                    message: 'Token is Invalid'
                })
            } else {
                req.customer = decode;
                next();
            }
        })
    } else {
        res.status(401).send({
            message: 'No Token'
        });
    }
};

/**
 * @swagger
 * /api/customers:
 *  get:
 *    summary: get all customers
 *    description: Use to request all customers
 *    security: 
 *      - bearerAuth: []
 *    responses:
 *      200:
 *        description: A successful response
 *      500:
 *        description: A response failed
 */
route.get('/customers', isAuth ,async (req, res) => {
    const customers = await Customer.find({});
    if (customers) {
        res.send(customers);
    } else {
        res.send({
            message: 'customer not found'
        })
    }
})

const generateToken = (customer) => {
    return jwt.sign({
            _id: customer._id,
            name: customer.name,
            email: customer.email,
        },
        process.env.JWT_SECRET || 'xyz', {
            expiresIn: '30d'
        }
    )
};


/**
 * @openapi
 * /api/register:
 *  post:
 *    summary: create customers
 *    description: Customer registration
 *    parameters:
 *     - in: body
 *       name: body
 *       required: true
 *       description: body of customer
 *    requestBody:
 *      content:
 *       application/json:
 *          schema:
 *            $ref: '#/definitions/Customer'
 *    responses:
 *     200:
 *       description: Customer created successful
 *     500:
 *       description: Request failed
 */
route.post('/register', async (req, res) => {
    const customer = await new Customer({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
        country: req.body.country,
    })
    const createdCustomer = await customer.save();
    res.send({
        message: 'registration successful',
        createdCustomer
    });
})


/**
 * @openapi
 * /api/login:
 *  post:
 *    summary: customer login
 *    description: Customer login
 *    requestBody:
 *      content:
 *       application/json:
 *          schema:
 *            $ref: '#/definitions/Customer'
 *    responses:
 *     200:
 *       description: Customer login successful
 *     500:
 *       description: Request failed
 */
route.post('/login', async (req, res) => {

    const customer = await Customer.findOne({
        email: req.body.email
    })
    if (customer) {
        if (bcrypt.compareSync(req.body.password, customer.password)) {
            res.send({
                message: 'customer login successful',
                customer,
                token: generateToken(customer)
            });
            console.log(customer)
            return;
        } else {
            return res.send('wrong password');
        }
    } else {
        return res.status(404).send({
            message: 'email not exist'
        })
    }

})

/**
 * @swagger
 * /api/details/{id}:
 *  post:
 *      summary: customer details
 *      description: customer details
 *      parameters: 
 *          - in: path
 *            name: path
 *            required: true
 *            description: customer Id
 *      security: 
 *          - bearerAuth: []
 *      responses :
 *       200: 
 *          description: success
 *              
 */

route.post('/details/:id', isAuth ,async(req, res) => {
    const customer = await Customer.findOne({id: req.params.id});
    if(customer){
        res.send(customer)
    }else{
        res.send('customer not found')
    }
})


/**
 * @swagger
 * /api/customer/{id}:
 *  put:
 *   summary: update customer
 *   description: update customer
 *   consumes:
 *    - application/json
 *   produces:
 *    - application/json
 *   parameters:
 *    - in: path
 *      name: id
 *      required: true
 *      description: id of the customer
 *   requestBody:
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/definitions/Customer'
 *   security:
 *      - bearerAuth: []
 *   responses:
 *    200:
 *     description: success
 *     content:
 *      application/json:
 *       schema:
 *        $ref: '#/definitions/Customer'
 */
route.put('/customer/:id' , isAuth, async (req, res) => {
    const customer = await Customer.findById(req.params.id)
    console.log(customer);
    if (customer) {
        customer.name = req.body.name || customer.name
        customer.email = req.body.email || customer.email
        customer.password = req.body.password || customer.password
        customer.country = req.body.country || customer.country

        const updatedCustomer = await customer.save();
        console.log(updatedCustomer);
        res.send({
            message: 'update success',
            updatedCustomer
        })
        
    } else {
        res.send({
            message: 'update failed'
        })
    }
});

/**
 * @swagger
 * /api/delete/{id}:
 *  delete:
 *   summary: delete customer
 *   description: delete customer
 *   parameters:
 *    - in: path
 *      name: id
 *      required: true
 *      description: id of the team
 *   security:
 *    - bearerAuth: []
 *   responses:
 *    200:
 *     description: success
 */
route.delete('/delete/:id', isAuth ,async (req, res) => {
   console.log(req.params.id);
    const customer = await Customer.findOne({id: req.params.id})
    console.log(customer);
    console.log(req.params.id);
    if (customer) {
        await customer.remove();
        res.send({
            message: 'delete success'
        })
    } else {
        res.send({
            message: 'customer not found'
        })
    }
})

module.exports = route;