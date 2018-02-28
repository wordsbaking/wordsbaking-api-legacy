const Bcrypt = require('bcrypt');

console.log(Bcrypt.hashSync(process.argv[2], process.argv[3] || 10));
