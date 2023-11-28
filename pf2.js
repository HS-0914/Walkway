// app.get('/pathfind/pf/:value', pathF2.pathFind);

import fetch from 'node-fetch';
import dbex from './db.js';
import * as geolib from 'geolib';

const tmapWalkKey = 'XkfHq8f9ff9te9zmfe3Y28d3DehpIIQd1FQnA8kL'; // 도보 안내 키

const odsayKey = '0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4'; // odsay api키
const tmapUrl = 'https://apis.openapi.sk.com/transit/routes'; // tmap url
// const tmapKey = 'XkfHq8f9ff9te9zmfe3Y28d3DehpIIQd1FQnA8kL'; // tmap api키 1
// const tmapKey = 'wsnAg8jbqiaNZOQaurrIPaCh9YOhDzV14ijVYp1O'; // tmap api키 2
// const tmapKey = 'pbnOeCNodia7zECoByh0F4tLA26KlRf250vja2zN'; // tmap api키 3
// const tmapKey = 'wO8NmopOFz55Ybq2mEgE6yvTKdBDYxx8kjNz7PAb'; // tmap api키 4
// const tmapKey = 'zkZxGg4pwt3Cqmqm9XEAU7K4Nt7NOXW9e8ZeA5zf'; // tmap api키 5

// const tmapKey = 'Yi7Eo8v1P868DSnSnLQ3e5KrJaJLQ2LE2B8UPch7'; // tmap api키 영_1
// const tmapKey = 'DN2iszCKMmasCc5jJlAfad2OoAGPGDh2M9izBFh0'; // tmap api키 영_2
const tmapKey = 'cyW90piLdV5bFF1UfIowd9LpdZvsYVw58j1Wf9zJ'; // tmap api키 영_3
// const tmapKey = 'wzAWns6VldawGD1FLlCzR1qjmPZ4zVus8fjVAnId'; // tmap api키 영_4
// const tmapKey = 'Yv4W9lBoSH2ESoK1IkV817OhhZQqx8tB5rZZaiGa'; // tmap api키 영_5



const metroType = {
    '수도권1호선': 'Line_1.png',
    '수도권2호선': 'Line_2.png',
    '수도권3호선': 'Line_3.png',
    '수도권4호선': 'Line_4.png',
    '수도권5호선': 'Line_5.png',
    '수도권6호선': 'Line_6.png',
    '수도권7호선': 'Line_7.png', 
    '수도권8호선': 'Line_8.png', 
    '수도권9호선': 'Line_9.png', 
    '경의중앙선': 'Line_K.png', 
    '공항철도': 'Line_A.png',
    '용인에버라인': 'Line_E.png',
    '경춘선': 'Line_G.png', 
    '수인분당선': 'Line_SB.png',
    '인천1호선': 'Line_I.png',
    '인천2호선': 'Line_I2.png',
    '신분당선': 'Line_S.png', 
    '우이신설선': 'Line_UI.png', 
    '서해선': 'Line_W.png', 
    '경강선': 'Line_KK.png',
    '신림선': 'Line_SL.png',
    '김포골드라인': 'Line_GG.png',
    '의정부경전철': 'Line_U.png'


    // m : 자기부상
    // sl : 신림
    // u : 의정부 경전철
    // gg : 김포골드
};
let isTrans = "WALK"; // 제자리 환승여부

async function pathFind (req, res) {
    

    const { value } = req.params;
    const val = JSON.parse(value);

    let sx = 0;
    let sy = 0;
    let ex = 0;
    let ey = 0;
    /* 
    app inventor global 텍스트 박스 순서
    [
        순서
        주소
        이름
        x
        y
    ]
    long => x, lat => y
    val
    0 => 최소 시간 1 => 최단 거리 2 => 최소 환승 3 => 최소 도보
    3 => 버스 + 지하철, 2 => 버스, 1 => 지하철, 4 => 사용자경로
    126.70477433726003, 37.47626918430598

    126.70371904820256, 37.4765390973651 집
    126.69083947747394, 37.47994794271305 열우물경기장
    126.91899885727172, 37.390592491805684 학교
    [   
        [ 0, 3, "출발지이름", "경유지이름", "도착지이름" ],
        [ "126.70477433726003", "37.47626918430598" ],
        [ "126.69083947747394", "37.47994794271305" ],
        [ "126.91899885727172", "37.390592491805684" ]
    ]

    */

    const sendPathList = []; // 앱으로 보낼 경로 리스트
    let haveStopO = false; // 경유지 여부

    if (val.length > 3) {
        haveStopO = true; // 경유지가 있음
    }
    if (val[0][1] == 4) {
        customPath(res, val);
        return;
    }

    for (let i = 1; i < val.length - 1; i++) { // 출발좌표, 도착좌표 - 마지막 도착 지점은 제외
        sx = val[i][0];
        sy = val[i][1];
        ex = val[i + 1][0];
        ey = val[i + 1][1];

        const tmapOpt = {
            method: 'POST',
            headers: {
                accept: 'application/json',
                'content-type': 'application/json',
                appKey: tmapKey
            },
            body: JSON.stringify({
                startX: sx,
                startY: sy,
                endX: ex,
                endY: ey,
                lang: 0,
                format: 'json',
                count: 10
            })
        };
            
        let tmapRes = await fetch(tmapUrl, tmapOpt);
        tmapRes = await tmapRes.json();

        if (tmapRes.error) {
            console.log("횟수 제한");
            return;
        }
        if (tmapRes.metaData == undefined) {
            return res.json("tmapRes.metaData == undefined");
        }
        const tmapD = tmapRes.metaData.plan.itineraries;
        var pathList = makeWay(tmapD, val[0], i+1); // 경로들 리스트
        if (val[0][1] == 3 && pathList.length == 0 && haveStopO) { // 버스 + 지하철 경로가 없고 경유지 있음
            var tmpList = [...val[0]];
            tmpList[1] = 2;
            pathList = pathList.concat(makeWay(tmapD, tmpList, i+1)); // 버스 경로
            tmpList[1] = 1;
            pathList = pathList.concat(makeWay(tmapD, tmpList, i+1)); // 지하철 경로
        }
        // console.log(pathList);
        sendPathList.push(pathList);
    }

    
    if (!haveStopO) { // 경유지 없음
        let tmpList = sortList(val[0][0], sendPathList[0]);
        console.log("정렬기준" + val[0][0]);
        console.log(sendPathList[0]);
        
        res.json(tmpList);
    } else { //경유지 있음

        var tmpList = [];
        for (let i = 0; i < sendPathList.length; i++) {
            const element = sendPathList[i];
            tmpList.push(sortList(val[0][0], element).slice(0, 3)); // 정렬된 배열중 3개만 추출
        }
        // console.log("tmpList");
        // console.log(tmpList);

        tmpList = generateCombinations(tmpList);
        
        var arrayList = [];
        for (let i = 0; i < tmpList.length; i++) { // 0~9
            const element = tmpList[i];
            var tmpList2 = [];
            var tmpList3 = [];
            for (let j = 0; j < element.length; j++) { // 0~3
                const element2 = element[j];
                tmpList2.push(element2[0]);
                tmpList3 = tmpList3.concat(element2.slice(1));
            }
            tmpList2 = addElement(tmpList2);
            tmpList3.unshift(tmpList2);
            arrayList.push(tmpList3);
        }
        arrayList = sortList(val[0][0], arrayList);
        // console.log(arrayList);
        res.json(arrayList);
    }
}

function sortList(i, list) { // 정렬
    list.sort(function(a, b) {
        return a[0][i] - b[0][i];
    });
    return list;
}

function generateCombinations(arrays) { // 경우의 수 생성
    if (arrays.length === 0) {
        return [[]];
    }

    var firstArray = arrays[0];
    var remainingArrays = arrays.slice(1);
    var combinationsWithoutFirst = generateCombinations(remainingArrays);
    var combinationsWithFirst = [];

    for (var i = 0; i < firstArray.length; i++) {
        for (var j = 0; j < combinationsWithoutFirst.length; j++) {
            combinationsWithFirst.push([firstArray[i]].concat(combinationsWithoutFirst[j]));
        }
    }

    return combinationsWithFirst;
}

function addElement(array) {
    var result = [0, 0, 0, 0];
    for (var i = 0; i < array.length; i++) {
        for (var j = 0; j < array[i].length; j++) {
            result[j] += array[i][j];
        }
    }
    result.push("경유지경로");
    return result;
}

function makeWay(tmapD, pathInfo, i) {
    const pathList = []; // 경로들 리스트

    for (let pi = 0; pi < tmapD.length; pi++) { // 경로 가지수 path Index
        const pathE = tmapD[pi]; // 경로 요소 1개
        if (pathE.pathType != pathInfo[1]) { // 버스 + 지하철 아님
            // console.log("pathE.pathType : " + pathE.pathType + "|| pathInfo[1] : " + pathInfo[1]);
            // console.log();
            continue;
        }
        const subPathList = [];
        subPathList.push([pathE.totalTime, pathE.totalDistance, pathE.transferCount, pathE.totalWalkTime]); // 총 소요시간, 총 이동거리, 총 환승 횟수, 총 도보 소요시간
        for (let si = 0; si < pathE.legs.length; si++) { // 세부 경로 가지수 subPath Index
            const subP = pathE.legs[si];
            var tmpList = []; // lineString 리스트 (임시);
            var tmpList2 = []; // lineString 리스트 (임시);
            if (subP.start.name == "출발지" && subP.mode == "WALK") { // 첫 시작
                subPathList.push(pathInfo[i] + " - " + parseInt(subP.sectionTime/60) + "분 " + subP.sectionTime%60 + "초");

                tmpList.push([subP.start.lon, subP.start.lat])
                // tmpList.push(["" + subP.start.lat, "" + subP.start.lon]) // appinventor linestring은 [y,x] 순서
                for (let j = 0; j < subP.steps.length; j++) {
                    const e = subP.steps[j];
                    const tmpArr = e.linestring.split(" "); //[xy, xy, ...]로 나뉨
                    tmpArr.pop();
                    for (let k = 0; k < tmpArr.length; k++) {
                        const e2 = tmpArr[k].split(","); // [x, y]로 나뉨
                        tmpList.push(e2.map(Number)); // [y, x] 형식으로 넣기
                        // tmpList.push([e2[1], e2[0]]); // [y, x] 형식으로 넣기
                    }
                }
                tmpList2.push(false);
                isTrans = "WALK";
            } else if (subP.end.name == "도착지" && subP.mode == "WALK") { //끝
                subPathList.push(pathInfo[i + 1] + " - " + parseInt(subP.sectionTime/60) + "분 " + subP.sectionTime%60 + "초 _ circle.png");

                tmpList.push([subP.start.lon, subP.start.lat])
                // tmpList.push(["" + subP.start.lat, "" + subP.start.lon]) // appinventor linestring은 [y,x] 순서
                for (let j = 0; j < subP.steps.length; j++) {
                    const e = subP.steps[j];
                    const tmpArr = e.linestring.split(" "); //[xy, xy, ...]로 나뉨
                    tmpArr.pop();
                    for (let k = 0; k < tmpArr.length; k++) {
                        const e2 = tmpArr[k].split(","); // [x, y]로 나뉨
                        tmpList.push(e2.map(Number)); // [y, x] 형식으로 넣기
                        // tmpList.push([e2[1], e2[0]]); // [y, x] 형식으로 넣기
                    }
                }
                tmpList2.push(false);
                isTrans = "WALK";
            } else { // 중간것들
                if (subP.mode == "WALK") { // 중간 환승
                    if (isTrans == pathE.legs[si+1].mode && pathE.legs[si+1].mode == "SUBWAY") { // 지하철 환승

                        // 나중에 환승시간 추가

                        subPathList.push(subP.start.name + " - " + parseInt(subP.sectionTime/60) + "분 " + subP.sectionTime%60 + "초 _ trans.png"); // 도보(환승) 표시
                    } else {
                        subPathList.push(subP.start.name + " - " + parseInt(subP.sectionTime/60) + "분 " + subP.sectionTime%60 + "초 _ walk.png"); // 도보(환승) 표시
                        isTrans = "WALK";
                    }
                } else if (subP.mode == "SUBWAY") { // 지하철
                    let str = subP.route.replace("(특급)", "");
                    str = str.replace("(급행)", "");
                    subPathList.push(subP.start.name + " - " + parseInt(subP.sectionTime/60) + "분 " + subP.sectionTime%60 + "초 _ " + metroType[str]); // 지하철 호선 사진
                    isTrans = "SUBWAY";
                } else { // 버스
                    subPathList.push(subP.start.name + " - " + parseInt(subP.sectionTime/60) + "분 " + subP.sectionTime%60 + "초 _ bus3.png"); // 버스 사진
                    isTrans = "BUS";
                }

                tmpList.push([subP.start.lon, subP.start.lat])
                // tmpList.push(["" + subP.start.lat, "" + subP.start.lon]);
                const tmpArr = subP.passShape.linestring.split(" ");
                for (let j = 0; j < tmpArr.length; j++) {
                    const e = tmpArr[j].split(",");
                    tmpList.push(e.map(Number));
                    // tmpList.push([e[1], e[0]]);
                }
                if ( subP.mode == "BUS" ) {
                    tmpList2.push(subP.route);
                    if (subP.Lane != undefined) {
                        for(let i = 0; i < subP.Lane.length; i++) {
                            if (subP.Lane[i].route == subP.route) {
                                continue;
                            }
                            tmpList2.push(subP.Lane[i].route);
                        }
                    }
                } else if (subP.mode == "SUBWAY") {
                    const st = Number(subP.passStopList.stationList[0].stationID);
                    const et = Number(subP.passStopList.stationList[1].stationID);
                    
                    if (st < et) {
                        tmpList2.push("하행");
                    } else {
                        tmpList2.push("상행");
                    }
                } else {
                    tmpList2.push(false);
                }
            }
            subPathList.push(tmpList);
            subPathList.push(tmpList2);
        }
        pathList.push(subPathList);
    }
    return pathList;
}

async function pathSave(req, res) {
    const db = await dbex.con;
    const value = req.body;

    console.log(value);
    let dbresult = [];
    [dbresult] = await db.execute("INSERT INTO Custom (path, sx, sy, ex, ey, User_id) VALUES (?, ?, ?, ? ,?, ?);", value);

    if (dbresult.affectedRows == 1) {
        return res.json(1);
    } else {
        return res.json(0);
    }
}
/*
    [   
        [ 0, 4, "출발지이름", "경유지이름", "도착지이름" ],
        [ "126.70477433726003", "37.47626918430598" ],
        [ "126.69083947747394", "37.47994794271305" ],
        [ "126.91899885727172", "37.390592491805684" ]
    ]

*/

async function customPath(res, valData) {
    const db = await dbex.con;

    
    const userSX = valData[1][0];
    const userSY = valData[1][1];
    const userEX = valData[valData.length-1][0];
    const userEY = valData[valData.length-1][1];

    const userS = {
        latitude: userSY,
        longitude: userSX
    };
    const userE = {
        latitude: userEY,
        longitude: userEX
    };
    const newX1 = geolib.computeDestinationPoint(userS, 1000, 90).longitude; // +1000미터 경도
    const newX2 = geolib.computeDestinationPoint(userS, -1000, 90).longitude; // -1000미터 경도


    const newY1 = geolib.computeDestinationPoint(userS, 1000, 0).latitude; // +1000미터 위도
    const newY2 = geolib.computeDestinationPoint(userS, -1000, 0).latitude; // -1000미터 위도

    console.log(`${newX2} < ${userS.longitude} < ${newX1}`);
    console.log(`${newY2} < ${userS.latitude} < ${newY1}`);
    const [rows] = await db.execute('SELECT * FROM Custom WHERE (sx between ? AND ?) AND (sy between ? AND ?)', [newX2, newX1, newY2, newY1]);

    console.log(rows.length);
   
    const tmpList = [];
    rows.forEach(element => {
        // console.log(`Element: ${element}`);
        const distance = geolib.getDistance(userS, { latitude: element.sy, longitude: element.sx });
        if (distance <= 1000) {
            tmpList.push(element);
        }
    });  

    const tmapUrl = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&callback=function';
    for (let i = 0; i < tmpList.length; i++) {
        const options = {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              appKey: tmapWalkKey
            },
            body: JSON.stringify({
              startX: userS.longitude,
              startY: userS.latitude,
              endX: tmpList[i].sx,
              endY: tmpList[i].sy,
              startName: '출발',
              endName: '도착',
              sort: 'index'
            })
        };
        let tRes = await fetch(tmapUrl, options);
        let tData = await tRes.json();
        var totalTime = tData.features[0].properties.totalTime;
        totalTime = `${parseInt(totalTime/60)}분 ${totalTime%60}초`;
        
        const tmp = JSON.parse(tmpList[i].path);
        tmpList[i].path = tmp;

        // tmpList[i].path = tmpList[i].path.replace("출발지 - 0분 0초", `${valData[0][2]} - ${totalTime}`);
        let walkData = tData.features;
        var tmpLine = [];
        for (let j = 0; j < walkData.length; j++) {
            if (walkData[j].geometry.type == "LineString") {
                tmpLine = tmpLine.concat(walkData[j].geometry.coordinates);
            }
        }
        tmpList[i].path[1] = tmpList[i].path[1].replace("출발지 - 0분 0초", `${valData[0][2]} - ${totalTime}`);
        tmpList[i].path[2] = tmpLine;
    }


    for (let i = 0; i < tmpList.length; i++) {
        const options = {
            method: 'POST',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
              appKey: tmapWalkKey
            },
            body: JSON.stringify({
              startX: tmpList[i].ex,
              startY: tmpList[i].ey,
              endX: userE.longitude,
              endY: userE.latitude,
              startName: '출발',
              endName: '도착',
              sort: 'index'
            })
        };
        let tRes2 = await fetch(tmapUrl, options);
        let tData2 = await tRes2.json();
        var totalTime = tData2.features[0].properties.totalTime;
        totalTime = `${parseInt(totalTime/60)}분 ${totalTime%60}초`;

        // tmpList[i].path = tmpList[i].path.replace("출발지 - 0분 0초", `${valData[0][2]} - ${totalTime}`);
        let walkData = tData2.features;
        var tmpLine = [];
        for (let j = 0; j < walkData.length; j++) {
            if (walkData[j].geometry.type == "LineString") {
                tmpLine = tmpLine.concat(walkData[j].geometry.coordinates);
            }
        }
        tmpList[i].path[tmpList[i].path.length-3] = tmpList[i].path[tmpList[i].path.length-3].replace("도착지 - 0분 0초", `${valData[0][valData[0].length-1]} - ${totalTime}`);
        tmpList[i].path[tmpList[i].path.length-2] = tmpLine;
    }

    const sendList = [];
    tmpList.forEach(element => {
        // console.log(`Element: ${element}`);
        element.path[0].push(element.id)
        sendList.push(element.path);

    });
    console.log(sendList);
    return res.json(sendList);
}

export default { pathFind, pathSave };


/* 
const odsayUrl = `https://api.odsay.com/v1/api/searchPubTransPathT?apiKey=${odsayKey}&lang=0&SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}&OPT=0&SearchPathType=${val[0][0]}`; // odsay url
        const odRes = await fetch(odsayUrl);
        const odData = await odRes.json();
        const path = odData.result.path; // 길찾기 정보 데이터
        if (path === undefined) { // 길찾기 실패
            console.log("err");
            res.send("err");
            return;
        }
        const pathList = []; // 경로들 리스트
        for (let pi = 0; pi < path.length; pi++) { // 경로 가지수 path Index
            const pathE = path[pi]; // 경로 요소 1개
            if (pathE.pathType != 3) { // 경로 타입이 버스 + 지하철이 아님(only 버스, only 지하철)
                continue;
            }
            pathList.push(pathE.info.mapObj);

            const subPathList = []; // 경로의 세부 경로 리스트
            for (let si = 0; si < pathE.subPath.length; si++) { // 경로의 세부 경로 가지수 subPath Index
                const subE = pathE.subPath[si]; // 경로의 세부 경로 1개
                if (si == 0 && subE.trafficType == 3) { // 출발지가 정류소가 아님 -> 출발지 이름, 좌표 필요
                    subPathList.push([val[0][i], [sx, sy]]); // 장소 이름, [x좌표, y좌표]
                }
                if (subE.trafficType == 1 && subE.startName != "서울역") { // 도보 아님, 지하철임
                    subPathList.push([subE.startName + '역', [subE.startX, subE.startY]]);
                } else if (subE.trafficType == 2 || subE.startName == "서울역") {
                    subPathList.push([subE.startName, [subE.startX, subE.startY]]);
                }
                if (si == pathE.subPath.length - 1 && subE.trafficType == 3) { // 도착지가 정류소가 아님 - > 도착지 이름, 좌표 필요
                    subPathList.push([val[0][i + 1], [ex, ey]]); // 장소 이름, [x좌표, y좌표]
                }
            }
            pathList.push(subPathList); // [ pathList ]에는 [ mapObj, [subPath(장소이름, xy좌표), subPath ...] ]

        }
        sendPathList.push(pathList);
    }
    console.log("sendPathList[0][1]");
    for (let index = 0; index < sendPathList[0].length; index++) {
        const element = sendPathList[0][index];
        if (index % 2 == 1) {
            console.log(element);
        }

    }
    console.log(sendPathList);
*/