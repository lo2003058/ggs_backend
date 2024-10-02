const express = require('express');
const {graphqlHTTP} = require('express-graphql');
const schema = require('./schema');
const cors = require('cors');
require('dotenv/config');
const {
  createCustomer, getAllCustomers, getCustomerById, updateCustomer, deleteCustomer
} = require('./customers');
const {
  createCompany, getAllCompanies, getCompanyById, updateCompany, deleteCompany
} = require('./companies');
const authenticateToken = require('./auth/authMiddleware');
const {register, login} = require('./auth');
const {shopifyCustomerSync} = require("./shopify");

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Middleware to parse JSON request bodies
app.use(express.json());

// GraphQL endpoint
app.use(
  '/graphql',
  authenticateToken,
  graphqlHTTP((req) => {
    return {
      schema: schema,
      graphiql: true,
      context: {
        user: req.user,
      },
    };
  })
);

// Default route
app.get('/', (req, res) => {
  res.send('Ready to make API calls!');
});

// Auth routes
app.post('/register', register);
app.post('/login', login);

// Companies CRUD
app.post('/companies', authenticateToken, createCompany);
app.get('/companies', authenticateToken, getAllCompanies);
app.get('/companies/:id', authenticateToken, getCompanyById);
app.put('/companies/:id', authenticateToken, updateCompany);
app.delete('/companies/:id', authenticateToken, deleteCompany);

// Customers CRUD
app.post('/customers', authenticateToken, createCustomer);
app.get('/customers', authenticateToken, getAllCustomers);
app.get('/customers/:id', authenticateToken, getCustomerById);
app.put('/customers/:id', authenticateToken, updateCustomer);
app.delete('/customers/:id', authenticateToken, deleteCustomer);

//shopify
app.get("/shopify/shopifyCustomerSync", authenticateToken, shopifyCustomerSync);


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
