// app.get('/pathfind/pf/:value', pathF2.pathFind);

import fetch from 'node-fetch';
import dbex from './db.js';
import * as geolib from 'geolib';

const tmapWalkKey = ' '; // 도보 안내 키
const odsayKey = ' '; // odsay api키
const tmapUrl = 'https://apis.openapi.sk.com/transit/routes'; // tmap url
const tmapKey = ' '; // tmap api키 2



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
    0 => 최소 시간 1 => 최단 거리 2 => 최소 환승 3 => 최소 도보
    3 => 버스 + 지하철, 2 => 버스, 1 => 지하철, 4 => 사용자경로
    126.70477433726003, 37.47626918430598
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
            tmpList.push(sortList(val[0][0], element).slice(0, 5)); // 정렬된 배열중 5개만 추출
        }
   
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
        res.json(arrayList.slice(0, 20));
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
    const pathList = []; // 경로 리스트

    for (let pi = 0; pi < tmapD.length; pi++) { // 경로 가지수 path Index
        const pathE = tmapD[pi]; // 경로 요소 1개
        if (pathE.pathType != pathInfo[1]) { // 조합별 분류
            continue;
        }
        const subPathList = [];
        subPathList.push([pathE.totalTime, pathE.totalDistance, pathE.transferCount, pathE.totalWalkTime]); // 총 소요시간, 총 이동거리, 총 환승 횟수, 총 도보 소요시간
        for (let si = 0; si < pathE.legs.length; si++) { // 세부 경로 가지수 subPath Index
            const subP = pathE.legs[si];
            var tmpList = [];
            var tmpList2 = [];
            if (subP.start.name == "출발지" && subP.mode == "WALK") { // 첫 시작
                subPathList.push(pathInfo[i] + " - " + parseInt(subP.sectionTime/60) + "분 " + subP.sectionTime%60 + "초");

                tmpList.push([subP.start.lon, subP.start.lat])
                for (let j = 0; j < subP.steps.length; j++) {
                    const e = subP.steps[j];
                    const tmpArr = e.linestring.split(" "); //[xy, xy, ...]로 나뉨
                    tmpArr.pop();
                    for (let k = 0; k < tmpArr.length; k++) {
                        const e2 = tmpArr[k].split(","); // [x, y]로 나뉨
                        tmpList.push(e2.map(Number)); // [y, x] 형식으로 넣기
                    }
                }
                tmpList2.push(false);
                isTrans = "WALK";
            } else if (subP.end.name == "도착지" && subP.mode == "WALK") { //끝
                subPathList.push(pathInfo[i + 1] + " - " + parseInt(subP.sectionTime/60) + "분 " + subP.sectionTime%60 + "초 _ circle.png");

                tmpList.push([subP.start.lon, subP.start.lat])
                for (let j = 0; j < subP.steps.length; j++) {
                    const e = subP.steps[j];
                    const tmpArr = e.linestring.split(" "); //[xy, xy, ...]로 나뉨
                    tmpArr.pop();
                    for (let k = 0; k < tmpArr.length; k++) {
                        const e2 = tmpArr[k].split(","); // [x, y]로 나뉨
                        tmpList.push(e2.map(Number)); // [y, x] 형식으로 넣기
                    }
                }
                tmpList2.push(false);
                isTrans = "WALK";
            } else {
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
                    subPathList.push(subP.start.name + " - " + subP.passStopList.stationList[1].stationName + "방면 _ " + metroType[str]); // 지하철 호선 사진
                    isTrans = "SUBWAY";
                } else { // 버스
                    let str = subP.route.split(":")[1];
                    if (Array.isArray(subP.Lane)) {
                        subPathList.push(subP.start.name + " - " + str + "번 외 " + subP.Lane.length + "대 _ bus3.png"); // 버스 사진
                    } else {
                        subPathList.push(subP.start.name + " - " + str + "번 _ bus3.png"); // 버스 사진
                    }
                    isTrans = "BUS";
                }

                tmpList.push([subP.start.lon, subP.start.lat])
                const tmpArr = subP.passShape.linestring.split(" ");
                for (let j = 0; j < tmpArr.length; j++) {
                    const e = tmpArr[j].split(",");
                    tmpList.push(e.map(Number));
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

    const newEX1 = geolib.computeDestinationPoint(userE, 1000, 90).longitude; // +1000미터 경도
    const newEX2 = geolib.computeDestinationPoint(userE, -1000, 90).longitude; // -1000미터 경도

    const newEY1 = geolib.computeDestinationPoint(userE, 1000, 0).latitude; // +1000미터 위도
    const newEY2 = geolib.computeDestinationPoint(userE, -1000, 0).latitude; // -1000미터 위도

    console.log(`${newX2} < ${userS.longitude} < ${newX1}`);
    console.log(`${newY2} < ${userS.latitude} < ${newY1}`);
    console.log(`${newEX2} < ${userE.longitude} < ${newEX1}`);
    console.log(`${newEY2} < ${userE.latitude} < ${newEY1}`);
    const [rows] = await db.execute('SELECT * FROM Custom WHERE (sx between ? AND ?) AND (sy between ? AND ?) AND (ex between ? AND ?) AND (ey between ? AND ?)', [newX2, newX1, newY2, newY1, newEX2, newEX1, newEY2, newEY1]);

    console.log(rows.length);
   
    const tmpList = [];
    rows.forEach(element => {
        // console.log(`Element: ${element}`);
        const distance = geolib.getDistance(userS, { latitude: element.sy, longitude: element.sx });
        if (distance <= 1000) {
            element.distance = distance;
            tmpList.push(element);
        }
    });

    tmpList.sort((a, b) => {
        return a.distance - b.distance;
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
        element.path[0].push(element.id)
        sendList.push(element.path);

    });
    console.log(sendList);
    return res.json(sendList);
}

async function getPath(req, res) {
    const { value } = req.params;
    const db = await dbex.con;
    const [rows] = await db.execute('SELECT path FROM Custom WHERE User_id = ?', [value]);
    const sendArr = []

    for (const element of rows) {
        var pathArr = JSON.parse(element.path);
        var tmpArr = [pathArr[4]];
        var lastI = pathArr.length - 1;
        for (const e of pathArr) {
            if (typeof e === 'string') {
                if(e.includes("circle.png") && !e.includes("도착지")) {
                    tmpArr.push(e)
                }
            }
        }
        var tmploc = pathArr[lastI-4]
        tmploc = tmploc[tmploc.length-1]
    
        let url = `https://api.odsay.com/v1/api/pointBusStation?apiKey=${odsayKey}&lang=0&x=${tmploc[0]}&y=${tmploc[1]}&radius=100`
        let transSch = await fetch(url); // 검색
        let transRes = await transSch.json(); // 나온값 json으로 파싱
        var tmpStn = transRes.result.lane[0].stationName
        tmpArr.push(tmpStn)
        console.log(tmpArr)
        sendArr.push(tmpArr)
    }

    console.log("sendArr")
    console.log(sendArr)

    res.send(sendArr)
}

export default { pathFind, pathSave, getPath };

