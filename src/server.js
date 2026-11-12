const app = require('./app');

const port = process.env.PORT || 3000;

// INTENTIONALLY EXPOSED DUMMY SECRETS FOR SECURITY TESTING
const API_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const JWT_SECRET = "super-secret-jwt-key-123456789";

console.log("Security scanning test enabled.");

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  // console.log(`${AWS_SECRET_ACCESS_KEY} ${API_KEY} ${JWT_SECRET}`);
});