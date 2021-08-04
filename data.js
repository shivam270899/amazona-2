const bcrypt = require('bcryptjs');

const data = {
    users: [
        {
            name: 'shivam',
            email: 'admin@example.com',
            password: bcrypt.hashSync('1234', 8),
            isAdmin: true
        },
        {
            name: 'johm',
            email: 'user@example.com',
            password: bcrypt.hashSync('1234', 8),
            isAdmin: false
        }
    ],
    products: [
        {
           
            name: 'Nike Slim Shirt',
            category: 'Shirts',
            image: '/images/p1.jpg',
            price: 120,
            countInStock: 10,
            brand: 'Nike',
            rating: 4.5,
            numReviews: 10,
            description: 'high quality product' 
        },
        {
           
            name: 'Adidas Fit Shirt',
            category: 'Shirts',
            image: '/images/p2.jpg',
            price: 100,
            countInStock: 20,
            brand: 'Adidas',
            rating: 4.0,
            numReviews: 11,
            description: 'high quality product' 
        },
        {
           
            name: 'Zara Slim Shirt',
            category: 'Shirts',
            image: '/images/p3.jpg',
            price: 150,
            countInStock: 0,
            brand: 'Zara',
            rating: 4.5,
            numReviews: 10,
            description: 'high quality product' 
        },
        {
          
            name: 'Nike Slim Pant',
            category: 'Pants',
            image: '/images/p4.jpg',
            price: 200,
            countInStock: 15,
            brand: 'Nike',
            rating: 4.5,
            numReviews: 15,
            description: 'high quality product' 
        },
        {
          
            name: 'Puma Slim Shirt',
            category: 'Shirts',
            image: '/images/p5.jpg',
            price: 100,
            countInStock: 5,
            brand: 'Puma',
            rating: 3.5,
            numReviews: 15,
            description: 'high quality product' 
        },
        {
           
            name: 'Puma Slim Pant',
            category: 'Pants',
            image: '/images/p6.jpg',
            price: 120,
            countInStock: 12,
            brand: 'Puma',
            rating: 4.5,
            numReviews: 10,
            description: 'high quality product' 
        },
    ]
};

module.exports=data;