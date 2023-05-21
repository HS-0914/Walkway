exports.reviewload = function(req, res) {
    const mysql = require('mysql');
    const q = req.query;
    console.log(q.title);
    console.log(q.description);
    
    
    // MySQL 서버와의 연결 생성
    const connection = mysql.createConnection({
        host     : 'localhost',    // MySQL 서버의 호스트 이름
        user     : 'root',         // MySQL 사용자 이름
        password : '3527',     // MySQL 사용자 비밀번호
        database : 'walkway'    // MySQL 데이터베이스 이름
    });

    // MySQL 서버와 연결
    connection.connect(function(err) {
        if (err) throw err;
        console.log('MySQL 서버와 연결되었습니다.');

        // 쿼리 실행
        connection.query('SELECT * FROM review', function (error, results, fields) {
            if (error) throw error;
            console.log(results);
        });

        // MySQL 서버와의 연결 해제
        connection.end(function(err) {
            if (err) throw err;
            console.log('MySQL 서버와의 연결이 해제되었습니다.');
        });
    });

    res.send('hi')

}
