const odsayKey = '0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4'; // odsay api키
const publicKey = '32c8O%2F2CZv4jgj8cvCaCc7vhw9VOZ6ntxQz77NBxnqUdp1i0fUoCB2sQHZGgY8PusgYc26%2BGftipAB512U4KJg%3D%3D'; // 공공데이터 api 키

exports.searchTrans = async function(req, res) {
    var mysql = require('mysql2/promise'); // db연동
    var con = await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "3527",
        database : 'walkway'
    });
    const { value } = req.params;
    const queryStr = `SELECT * FROM pubtrans_tago WHERE nodeName like '%${value}%'`
    let [row] = await con.query(queryStr);
    console.log(row);

//=====================================   
// =========================0522 제거
//==========================================
    
    res.json(row);
    con.end();
}

exports.getTime = async function(req, res) {
    const { cityCode } = req.params;
    const { stID } = req.params;
    var url = `http://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList?serviceKey=${publicKey}&_type=json&cityCode=${cityCode}&nodeId=${stID}`;
    const timeSch = await fetch(url); // 검색
    const timeRes = await timeSch.json(); // 나온값 json으로 파싱
    var timeData = timeRes.response.body.items.item;
    console.log(timeData)

    res.send(timeData)
}