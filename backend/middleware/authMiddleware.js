const jwt = require("jsonwebtoken");
const response = require("../utils/responseHandler");

const authMiddleware = (req, res, next) => {

    // Token is usually sent in req.headers.authorization
    // const authToken = req.cookies?.auth_token;


//     console.log("Auth Token:", req.cookies?.auth_token);
// console.log("Decoded:", req.user);

    // if (!authToken) {
    //   return response(res, 401, "Authorization token missing. Please provide token");
    // }

    // Remove Bearer prefix if present

const authHeader = req.headers['authorization'];

if(!authHeader || !authHeader.startsWith('Bearer')){
   return response(res, 401, "Authorization token missing. Please provide token");
}

const token = authHeader.split(' ')[1];
   
try{
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    console.log("Authenticated User:", req.user);

    next();

  } catch (error) {
    console.error(error);
    return response(res, 401, "Invalid or expired token");
  }
};






module.exports = authMiddleware;
