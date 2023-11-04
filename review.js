import dbex from './db.js';

function reviews(req, res) {
    const db = dbex.con;

    db.end();
    res.send('hi')

}

export default { reviews };