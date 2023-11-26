import express from 'express';

import logins from './login.js';
import searchT from './search.js';
import pathF from './pathfind.js';
import pathF2 from './pf2.js';
import alarmS from './alarm.js';
// import reviewW from './review.js';

const app = express();

app.use(express.json()); // post처리
app.use(express.urlencoded({ extended: true })); // post처리

// listen(서버띄울 포트번호, 띄운 후 실행할 코드) , http://localhost:8080/
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}...`);
});

//app.get('경로', function(요청, 응답){});
//app.get('경로', (요청, 응답) => {});
//res.json() --> json 보내기
app.get('/', async (요청, 응답) => {
    응답.send('hs branch');
});

// /search -> 대중교통 검색, /pathfind -> 길찾기
// const { xxx } = req.params => 이런것도 있다
app.get('/search/:value', searchT.searchTrans); // 대중교통 검색
app.get('/search2/:value', searchT.searchTrans2); // 대중교통 검색
app.get('/search/bustime/:stID', searchT.busgetTime) // 버스 도착정보
app.get('/search/metrotime/:stName', searchT.metrogetTime) // 지하철 도착정보


app.get('/pathfind/sp/:value', pathF.searchPlace);
app.get('/pathfind/pf/:value', pathF2.pathFind);
app.post('/pathsave', pathF2.pathSave);


app.get('/login/:login_id/:password', logins.login); // 로그인
app.get('/signup/:login_value', logins.signup); // 회원가입


app.post('/alarm/schedule', alarmS.schedule); // 스케줄 지하철
app.post('/alarm/schedule2', alarmS.schedule2); // 스케줄 버스 , 출발시간 버스
app.post('/alarm/schedule3', alarmS.schedule3); // 출발시간 지하철

// app.get('/pathfind/pf/:value', pathF.pathFind);
// app.get('/pathfind/pd/:value', pathF.pathDraw);
// app.get('/review', reviewW.reviewload);


// url 인코딩 https://it-eldorado.tistory.com/143
// apiKey = 0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4
// 한시간만에 Node.js 백엔드 기초 끝내기 (ft. API 구축) - https://youtu.be/Tt_tKhhhJqY
// npx iisexpress-proxy http://localhost:8080 to 8081
// git 명령어 https://eehoeskrap.tistory.com/666
// import / export https://velog.io/@han0gu/node-export-import
// https://stackoverflow.com/questions/54315104/error-gcloud-app-deploy-error-response-9-cloud-build-xxxxxxxxxxxx-status