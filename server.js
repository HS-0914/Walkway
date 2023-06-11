const app = require('express')();

const searchT = require('./search');
const pathF = require('./pathfind');
const reviewW = require('./review');
const alarmS = require('./alarm');


// listen(서버띄울 포트번호, 띄운 후 실행할 코드) , http://localhost:8080/
app.listen(8082, function(){
    console.log('listening on 8082');
});

//app.get('경로', function(요청, 응답){});
//app.get('경로', (요청, 응답) => {});
//res.json() --> json 보내기
app.get('/', async (요청, 응답) => {

    var request = require('request');

    var url = 'http://apis.data.go.kr/B553766/smt-transfer/transfer';
    var queryParams = '?' + encodeURIComponent('serviceKey') + '=32c8O/2CZv4jgj8cvCaCc7vhw9VOZ6ntxQz77NBxnqUdp1i0fUoCB2sQHZGgY8PusgYc26+GftipAB512U4KJg=='; /* Service Key*/
    queryParams += '&' + encodeURIComponent('pageNo') + '=' + encodeURIComponent('1'); /* */
    queryParams += '&' + encodeURIComponent('numOfRows') + '=' + encodeURIComponent('10'); /* */
    queryParams += '&' + encodeURIComponent('transferStation') + '=' + encodeURIComponent('0212'); /* */
    queryParams += '&' + encodeURIComponent('fromLine') + '=' + encodeURIComponent('2'); /* */
    queryParams += '&' + encodeURIComponent('toLine') + '=' + encodeURIComponent('7'); /* */
    var respp;
    var bodyyy;
    
    request({
        url: url + queryParams,
        method: 'GET',
    }, function (error, response, body) {
        console.log('Status', response.statusCode);
        console.log('Headers', JSON.stringify(response.headers));
        console.log('Reponse received', body);
    });
    응답.send('testR2');
});

// /search -> 대중교통 검색, /pathfind -> 길찾기
// const { xxx } = req.params => 이런것도 있다
app.get('/search/:value', searchT.searchTrans);
app.get('/search/time/:cityCode/:stID', searchT.getTime)
app.get('/pathfind/sp/:value', pathF.searchPlace);
app.get('/pathfind/pf/:value', pathF.pathFind);
app.get('/pathfind/pd/:value', pathF.pathDraw);
app.get('/alarm/schedule/:x/:y', alarmS.schedule);
app.get('/review', reviewW.reviewload);
// url 인코딩 https://it-eldorado.tistory.com/143
// apiKey = 0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4
// 한시간만에 Node.js 백엔드 기초 끝내기 (ft. API 구축) - https://youtu.be/Tt_tKhhhJqY
// npx iisexpress-proxy http://localhost:8080 to 8081