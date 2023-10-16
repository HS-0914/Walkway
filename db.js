import mysql from 'mysql2/promise'; // db연동

var con = mysql.createConnection({
    host: "34.64.230.27",
    user: "root",
    password: "0000",
    database : 'walkway'
});

export default { con };