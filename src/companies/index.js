const {PrismaClient} = require('@prisma/client');
const {logError} = require("../log");
const prisma = new PrismaClient();

// Create a new company
const createCompany = async (req, res) => {
  try {
    const {
      name, email, phone, address1, address2, city, province, zip, country
    } = req.body;
    const company = await prisma.company.create({
      data: {name, email, phone, address1, address2, city, province, zip, country}
    });
    res.json(company);
  } catch (error) {
    // Log the error
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error creating company'});
  }
};

// Get all companies
const getAllCompanies = async (req, res) => {
  try {
    const companies = await prisma.company.findMany({
      include: {customers: true}  // Fetch related customer details
    });
    res.json(companies);
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error fetching companies'});
  }
};

// Get company by ID
const getCompanyById = async (req, res) => {
  try {
    const {id} = req.params;
    const company = await prisma.company.findUnique({
      where: {id: parseInt(id)},
      include: {customers: true}  // Fetch related customer details
    });
    res.json(company);
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error fetching company'});
  }
};

// Update company by ID
const updateCompany = async (req, res) => {
  try {
    const {id} = req.params;
    const {name, email, phone, address1, address2, city, province, zip, country} = req.body;
    const company = await prisma.company.update({
      where: {id: parseInt(id)},
      data: {name, email, phone, address1, address2, city, province, zip, country}
    });
    res.json(company);
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error updating company'});
  }
};

// Delete company by ID
const deleteCompany = async (req, res) => {
  try {
    const {id} = req.params;
    await prisma.company.delete({
      where: {id: parseInt(id)}
    });
    res.json({message: 'Company deleted successfully'});
  } catch (error) {
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error deleting company'});
  }
};

module.exports = {
  createCompany,
  getAllCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
};
