const jwt = require('jsonwebtoken');
const { Account } = require("../model/model");


const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const isAdmin = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const user = await Account.findById(userId);
  
      if (!user || !user.admin) {
        return res.status(403).json({ message: 'Access denied. Admins only.' });
      }
  
      next();
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

  const canUpdateProfile = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const targetAccountId = req.params.id;
      
      const user = await Account.findById(userId);
      
      if (user.admin || userId === targetAccountId) {
        next();
      } else {
        return res.status(403).json({ 
          success: false,
          message: 'Bạn không có quyền cập nhật profile này' 
        });
      }
    } catch (err) {
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  };

  module.exports = { authenticateToken, isAdmin , canUpdateProfile};
