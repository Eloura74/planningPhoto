const express = require('express');
const router = express.Router();
const { register, login } = require('./service');

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, isGroupMember } = req.body;
    const user = await register(name, email, phone, password, role, isGroupMember);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await login(email, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
