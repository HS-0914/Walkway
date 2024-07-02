import mysql from 'mysql2/promise'; // db연동

var con = mysql.createConnection({
    host: " ",
    user: "root",
    password: " ",
    database : 'walkway'
});

export default { con };