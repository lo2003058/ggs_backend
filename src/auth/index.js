const {PrismaClient} = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {logError} = require("../log");

const JWT_SECRET = process.env.JWT_SECRET;

const register = async (req, res) => {
  try {
    const {username, email, password, name} = req.body;

    // check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {email}
    });
    if (existingUser) {
      return res.status(400).json({error: 'Email already in use'});
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name
      }
    });

    res.json({message: 'User registered successfully'});
  } catch (error) {
    console.error(error);
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error registering user'});
  }
};

const login = async (req, res) => {
  try {
    const {email, password} = req.body;

    // find user by email
    const user = await prisma.user.findUnique({
      where: {email}
    });
    if (!user) {
      return res.status(400).json({error: 'Invalid credentials'});
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(400).json({error: 'Invalid credentials'});
    }

    const token = jwt.sign(
      {userId: user.id},
      JWT_SECRET,
      {expiresIn: '1h'}
    );
    console.log("token: ", token);
    res.json({
      token, user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });
  } catch (error) {
    console.error(error);
    await logError({
      level: 'ERROR',
      message: error.message,
      stackTrace: error.stack,
      endpoint: req.originalUrl,
      method: req.method,
      userId: req.user ? req.user.userId : null,
    });
    res.status(500).json({error: 'Error logging in'});
  }
};

module.exports = {
  register,
  login
};
