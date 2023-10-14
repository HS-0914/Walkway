var mysql = require('mysql2/promise'); // db연동
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "0000",
    database : 'walkway'
});
module.exports = con;