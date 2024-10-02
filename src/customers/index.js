const {PrismaClient} = require('@prisma/client');
const {logError} = require("../log");
const prisma = new PrismaClient();

// Create a new customer
const createCustomer = async (req, res) => {
  try {
    const {first_name, last_name, full_name, email, phone, companyId} = req.body;
    const customer = await prisma.customer.create({
      data: {first_name, last_name, full_name, email, phone, companyId}
    });
    res.json(customer);
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack || '',
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error creating customer'});
  }
};

// Get all customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      include: {company: true}  // Fetch related company details
    });
    res.json(customers);
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack || '',
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error fetching customers'});
  }
};

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const {id} = req.params;
    const customer = await prisma.customer.findUnique({
      where: {id: parseInt(id)},
      include: {company: true}  // Fetch related company details
    });
    res.json(customer);
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack || '',
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error fetching customer'});
  }
};

// Update customer by ID
const updateCustomer = async (req, res) => {
  try {
    const {id} = req.params;
    const {first_name, last_name, full_name, email, phone, companyId} = req.body;
    const customer = await prisma.customer.update({
      where: {id: parseInt(id)},
      data: {first_name, last_name, full_name, email, phone, companyId}
    });
    res.json(customer);
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack || '',
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error updating customer'});
  }
};

// Delete customer by ID
const deleteCustomer = async (req, res) => {
  try {
    const {id} = req.params;
    await prisma.customer.delete({
      where: {id: parseInt(id)}
    });
    res.json({message: 'Customer deleted successfully'});
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack || '',
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error deleting customer'});
  }
};

module.exports = {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
