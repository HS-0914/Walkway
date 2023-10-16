import mysql from 'mysql2/promise'; // db연동

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "0000",
    database : 'walkway'
});

export default { con };