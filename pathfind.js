const e = require("express");

exports.searchPlace = async function(req, res) {
    const { value } = req.params;
    var arr = [];
    var url = `https://dapi.kakao.com/v2/local/search/address.json?query=${value}`;
    const opt = { // 헤더 + 키값
        method: "GET",
        headers: {
            "Authorization" : "KakaoAK 73362b563d16a5769db3be063310d5cd",
        },
    };

    var result = await fetch(url, opt); // 주소로 검색
    var data = await result.json();
    if(data.meta.total_count > 0) {
        for(var i = 0; i < data.documents.length; i++){
            var sendData = {
                "address_name" : data.documents[i].address_name,
                "place_name" :  data.documents[i].address_name,
                "x" : data.documents[i].x,
                "y" : data.documents[i].y
             };
             arr.push(sendData);
        }
    } else { // 주소 검색결과가 없으면 키워드 검색
        url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${value}`;
        result = await fetch(url, opt);
        data = await result.json();
        for(var i = 0; i < data.documents.length; i++){
            var sendData = {
                "address_name" : data.documents[i].address_name,
                "place_name" :  data.documents[i].place_name,
                "x" : data.documents[i].x,
                "y" : data.documents[i].y
             };
             arr.push(sendData);
        }
    }
    console.log(arr);
    res.json(arr);
}

exports.pathFind = async function(req, res) {
    const { value } = req.params;
    const val = JSON.parse(value);
    const sx = val[0][2][1];
    const sy = val[0][3][1];
    const ex = val[1][2][1];
    const ey = val[1][3][1];
    const odsayKey = '0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4'; // odsay api키
    const tmapKey = 'XkfHq8f9ff9te9zmfe3Y28d3DehpIIQd1FQnA8kL'; // tmap api키
    const odsayUrl = `https://api.odsay.com/v1/api/searchPubTransPathT?apiKey=${odsayKey}&lang=0&SX=${sx}&SY=${sy}&EX=${ex}&EY=${ey}`; // odsay url
    const tmapUrl = 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1&callback=function'; // tmap url
    let options = { // tmap api 옵션
        method: 'POST',
        headers: {
            accept: 'application/json',
            'content-type': 'application/json',
            appKey: tmapKey
        },
        body: JSON.stringify({
            startX: 0,
            startY: 0,
            endX: 0,
            endY: 0,
            startName: '%ec%8b%9c%ec%9e%91',
            endName: '%eb%81%9d',
            searchOption: '0',
        })
    };

    const odRes = await fetch(odsayUrl);
    const odData = await odRes.json();
    const path = odData.result.path;
    console.log('=======================================');

    const pathArr = [];
    const pathArr2 = [];
    for (let i = 0; i < path.length; i++) {
        const pathSec = [];
        const pathSum = []; // 경로 요약
        const pathStn = []; // 경로 요약 정류장의 세부 정보
        const pathE = path[i];
        let needWalk = false;
        let totalTime = 0;
        let tmpB = JSON.parse(options.body);
        tmpB.startX = Number(sx);
        tmpB.startY = Number(sy);
        options.body = JSON.stringify(tmpB);
        for (let j = 0; j < pathE.subPath.length; j++) {
            const subE = pathE.subPath[j];
            // trafficType ==> 1:지하철, 2:버스, 3:도보, 4:지하철 환승, 5:버스 환승
            if(subE.trafficType == 3 && subE.distance == 0 && j != 0 && j != pathE.subPath.length - 1) { // 환승일때
                if(pathE.subPath[j-1].trafficType == 1) { // 지하철 - 지하철 환승
                    subE.trafficType = 4;
                    subE.sectionTime = [pathE.subPath[j-1].lane[0].subwayCode, pathE.subPath[j+1].lane[0].subwayCode];
                } else { // 버스-버스 제자리 환승
                    subE.trafficType = 5;
                }
                var tmpE = {
                    trafficType: subE.trafficType,
                    sectionTime: subE.sectionTime,
                    name: "환승"
                }
                pathSec.push(tmpE)
            }
            if(subE.trafficType == 3) { // 도보
                if(j == pathE.subPath.length - 1) { // 마지막 도보
                    let tmpB = JSON.parse(options.body);
                    tmpB.endX = Number(ex);
                    tmpB.endY = Number(ey);
                    options.body = JSON.stringify(tmpB);
                    const tRes = await fetch(tmapUrl, options);
                    const tData = await tRes.json();
                    const tDistance = tData.features[0].properties.totalDistance;
                    const tTime = calculateTime(tDistance);
                    
                    var tmpE = {
                        trafficType: subE.trafficType,
                        startX: tmpB.startX,
                        startY: tmpB.startY,
                        endX: tmpB.endX,
                        endY: tmpB.endY,
                        distance: tDistance,
                        sectionTime: tTime
                    }
                    pathSec.push(tmpE);
                    pathSum.push(pathE.info.lastEndStation)// 마지막 하차 정류장
                } else if(j == 0 && subE.distance == 0) { // 정류장이나 역에서 출발하는 도보
                    var tmpE = {
                        trafficType: subE.trafficType,
                        distance: subE.distance,
                        sectionTime: subE.sectionTime
                    }
                    pathSec.push(tmpE);
                } else { // 중간 도보
                    needWalk = true;
                    pathSec.push({});
                }
            }
            if(subE.trafficType == 1 || subE.trafficType == 2) { // 대중교통
                let tmpB = JSON.parse(options.body);
                if (needWalk == true) { // 이전에 도보 경로가 있었음
                    tmpB.endX = subE.startX;
                    tmpB.endY = subE.startY;
                    options.body = JSON.stringify(tmpB);
                    const tRes = await fetch(tmapUrl, options);
                    const tData = await tRes.json();
                    const tDistance = tData.features[0].properties.totalDistance;
                    const tTime = calculateTime(tDistance);
       
                    pathSec[j-1] = {
                        trafficType: 3,
                        startX: tmpB.startX,
                        startY: tmpB.startY,
                        endX: tmpB.endX,
                        endY: tmpB.endY,
                        distance: tDistance,
                        sectionTime: tTime
                    };
                }
                
                var tmpE = {
                    trafficType: subE.trafficType,
                    startName: subE.startName,
                    startX: subE.startX,
                    startY: subE.startY,
                    endName: subE.endName,
                    endX: subE.endX,
                    endY: subE.endY,
                    distance: subE.distance,
                    sectionTime: subE.sectionTime,
                    stationCount: subE.stationCount,
                    lane: subE.lane,
                    startArsID: subE.startArsID,
                    endArsID: subE.endArsID,
                    passStopList: subE.passStopList.stations
                };
                pathSec.push(tmpE);
                pathSum.push(subE.startName);
                pathStn.push(subE.lane);
                tmpB.startX = subE.endX;
                tmpB.startY = subE.endY;
                options.body = JSON.stringify(tmpB);
                needWalk = false;
            }
        }
        const pathSec2 = [];
        for (let k = 0; k < pathSec.length; k++) {
            const element = pathSec[k];
            if(Number.isInteger(element.sectionTime)) {
                totalTime += element.sectionTime;
            }
            var valueArr = Object.values(element);
            pathSec2.push(valueArr);
        }
        pathSum.unshift(totalTime);
        pathSum.push(pathE.info.mapObj);
        pathSec.push(pathStn);
        pathSec2.push(pathStn);
        pathSec.push(pathSum);
        pathSec2.push(pathSum);
        pathArr.push(pathSec);
        pathArr2.push(pathSec2);
        
    }
    console.log(pathArr2);
    res.json(pathArr2);
}

exports.pathDraw = async function(req, res) {
    const { value } = req.params;
    const odsayKey = '0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4'; // odsay api키
    const odsayUrl = `https://api.odsay.com/v1/api/loadLane?apiKey=${odsayKey}&lang=0&mapObject=0:0@${value}`; // odsay url
    const odRes = await fetch(odsayUrl);
    const odData = await odRes.json();
    let lane = odData.result.lane;
    for (let i = 0; i < lane.length; i++) {
        for (let j = 0; j < lane[i].section[0].graphPos.length; j++) {
            const element = lane[i].section[0].graphPos[j];
            const tmpArr = Object.values(element);
            lane[i].section[0].graphPos[j] = tmpArr;
        }
        lane[i].section = lane[i].section[0].graphPos;
        const tmpArr = Object.values(lane[i]);
        lane[i] = tmpArr;
    }
    console.log('=======================================');
    res.json(lane);
}

function calculateTime(distance) {
    if (distance > 99 || distance < 1000) {
        var quotient = Math.floor(distance / 10);
        var tensDigit = quotient % 10;
        if (tensDigit > 5)
            distance = Math.round(distance / 100) * 100;
    }
    const speed = 3.5;    // 속도 (km/h)

    // 속도를 분 당 거리로 변환 (m/분)
    const speedPerMinute = (speed * 1000) / 60;
  
    // 거리를 시간으로 나누어 시간 계산 (분)
    let time = distance / speedPerMinute;
    if(time < 1)
        time = 1;

    return Math.round(time);
}