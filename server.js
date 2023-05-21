const app = require('express')();

const searchT = require('./search');
const pathF = require('./pathfind');
const reviewW = require('./review');


// listen(서버띄울 포트번호, 띄운 후 실행할 코드) , http://localhost:8080/
app.listen(8080, function(){
    console.log('listening on 8080');
});

//app.get('경로', function(요청, 응답){});
//app.get('경로', (요청, 응답) => {});
//res.json() --> json 보내기
app.get('/', async (요청, 응답) => {

    var url = 'http://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCtyCodeList';
    var queryParams = '?' + encodeURIComponent('serviceKey') + '=49i%2BWE6UMj7c7HFKZNKH0CBA0Rn4JlJk5%2FJERy0A2rcwSqkYXiockIJL4IBNdzyr%2F0cgmmxa0TA3MNLbomlIjw%3D%3D'; /* Service Key*/
    queryParams += '&' + encodeURIComponent('_type') + '=' + encodeURIComponent('json'); /* */

    const testR = await fetch(url + queryParams);
    const testR2 = await testR.json();
    // console.dir(testR2.response.body.items, {'maxArrayLength':null});
    응답.send(testR2.response.body.items);
});

// /search -> 대중교통 검색, /pathfind -> 길찾기
// const { xxx } = req.params => 이런것도 있다
app.get('/search/:value', searchT.searchTrans);
app.get('/pathfind/:value', pathF.searchPlace);
app.get('/review', reviewW.reviewload);
app.get('/search/time/:cityCode/:stID', searchT.getTime)
// url 인코딩 https://it-eldorado.tistory.com/143
// apiKey = 0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4
// 한시간만에 Node.js 백엔드 기초 끝내기 (ft. API 구축) - https://youtu.be/Tt_tKhhhJqY
// npx iisexpress-proxy http://localhost:8080 to 8081