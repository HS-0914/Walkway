import dbex from './db.js';

const odsayKey = 'IEihA7yo5xIUcdyJZITl6JiterN6NeHi6Xlt9MXZaKA'; // odsay api키
const publicKey = '32c8O%2F2CZv4jgj8cvCaCc7vhw9VOZ6ntxQz77NBxnqUdp1i0fUoCB2sQHZGgY8PusgYc26%2BGftipAB512U4KJg%3D%3D'; // 공공데이터 api 키
const metroKey = '7a4b547161677564373349725a5a5a' //서울 지하철 키

const odsayMT = { // 오디세이 노선
    'Line_1.png': 1,
    'Line_2.png': 2,
    'Line_3.png': 3,
    'Line_4.png': 4,
    'Line_5.png': 5,
    'Line_6.png': 6,
    'Line_7.png': 7,
    'Line_8.png': 8,
    'Line_9.png': 9,
    'Line_K.png': 104,
    'Line_A.png': 101,
    'Line_G.png': 108,
    'Line_SB.png': 116,
    'Line_S.png': 109,
    'Line_UI.png': 113,
    'Line_W.png': 114,
    'Line_KK.png': 112
}

const busType = {
    1: '일반',
    2: '좌석',
    3: '마을',
    4: '직행좌석',
    5: '공항',
    6: '간선급행',
    10: '외곽',
    11: '간선',
    12: '지선',
    13: '순환',
    14: '광역',
    15: '급행',
    16: '관광',
    20: '농어촌',
    22: '경기도 시외형',
    26: '급행간선'
};

const busType_seoul = {
    0: '공용',
    1: '공항',
    2: '마을',
    3: '간선',
    4: '지선',
    5: '순환',
    6: '광역',
    7: '인천',
    8: '경기',
    9: '폐지'
};

const metroType = {
    1001: 'Line_1.png',
    1002: 'Line_2.png',
    1003: 'Line_3.png',
    1004: 'Line_4.png',
    1005: 'Line_5.png',
    1006: 'Line_6.png',
    1007: 'Line_7.png',
    1008: 'Line_8.png',
    1009: 'Line_9.png',
    1061: '중앙선',
    1063: 'Line_K.png',
    1065: 'Line_A.png',
    1067: 'Line_G.png',
    1075: 'Line_SB.png',
    1077: 'Line_S.png',
    1092: 'Line_UI.png',
    1093: 'Line_W.png',
    1081: 'Line_KK.png'
    // m : 자기부상
    // sl : 신림
    // u : 의정부 경전철
    // gg : 김포골드
};
const db = await dbex.con;

async function schedule(req, res) { // 스케줄 지하철
    const val = req.body;
    console.log(val);
    let stnKey = null;
    for (const key in val) {
        if (key.includes("png")) {
            stnKey = key;
            break;
        }
    }
    const x = val[stnKey][0][0];
    const y = val[stnKey][0][1];
    let url = `https://api.odsay.com/v1/api/pointBusStation?apiKey=${odsayKey}&lang=0&x=${x}&y=${y}`;
    let transSch = await fetch(url); // 검색
    let transRes = await transSch.json(); // 나온값 json으로 파싱
    let transID = null; // 위치로 정류장ID 찾기
    for (const item of transRes.result.lane) {
        if (item.stationClass == 2) {
            transID = item; // 위치로 역찾기
            break;
        }
    }

    url = `http://swopenAPI.seoul.go.kr/api/subway/${metroKey}/json/realtimeStationArrival/0/100/${transID.stationName}`;
    console.log(url);

    const metroSch = await fetch(url); // 검색
    const metroRes = await metroSch.json(); // 나온값 json으로 파싱

    const metroLength = metroRes.total; // 데이터 갯수

    if (metroLength == 0) {
        console.log("typeGroups");
        res.send("err");
        return;
    }
    const metroData = metroRes.realtimeArrivalList; // 결과값
    const typeGroups = {}; // 노선별 그룹
    let upArr = []; //상행
    let downArr = []; //하행
    let downObj = {};
    let str = ''; // 방면

    metroData.forEach(metro => {
        const type = metro.subwayId;
        str = metro.trainLineNm.split("-");
        str = str[1].replace("방면", "");
        str = str.replace("(특급)", "");
        str = str.replace("(급행)", "");
        str = str.trim();

        if (!typeGroups[metroType[type]]) {
            typeGroups[metroType[type]] = [];
            typeGroups[metroType[type]].push(str + ' - 상행');
        }

        // const tmpArr = [metroType[type], +metro.ordkey.substr(2, 3), metro.bstatnNm, metro.arvlMsg2, metro.btrainNo, metro.recptnDt];
        const tmpArr = [metroType[type], +metro.ordkey.substr(2, 3), metro.bstatnNm, metro.arvlMsg2];

        if (metro.updnLine == '상행') {
            upArr.push(tmpArr);
        } else {
            if (!downObj[metroType[type]]) {
                downObj[metroType[type]] = str + ' - 하행';
            }
            downArr.push(tmpArr);
        }
    });

    upArr.sort((a, b) => a[1] - b[1]);
    downArr.sort((a, b) => a[1] - b[1]);
    upArr.forEach(arr => {
        const tmpArr = [...arr];
        tmpArr.shift();
        typeGroups[arr[0]].push(tmpArr);
    });

    for (const key in typeGroups) {
        if (typeGroups.hasOwnProperty(key)) {
            typeGroups[key].push(downObj[key]);
        }
    }

    downArr.forEach(arr => {
        const tmpArr = [...arr];
        tmpArr.shift();
        typeGroups[arr[0]].push(tmpArr);
    });
    console.log(typeGroups);
    res.send(typeGroups);


}

async function schedule2(req, res) { // 스케줄 버스 , 출발시간 버스
    const val = req.body;
    console.log("val");
    console.log(val);
    let stnKey = null;
    for (const key in val) {
        if (key.includes("png")) {
            stnKey = key;
            break;
        }
    }
    const x = val[stnKey][0][0];
    const y = val[stnKey][0][1];
    const stnN = val[stnKey][1];
    const stnNo = [];
    for (const item of stnN) {
        const busNo = item.split(':')[1];
        stnNo.push(busNo); // 숫자로 저장
    }
    let url = `https://api.odsay.com/v1/api/pointBusStation?apiKey=${odsayKey}&lang=0&x=${x}&y=${y}&radius=100`;
    let transSch = await fetch(url); // 검색
    let transRes = await transSch.json(); // 나온값 json으로 파싱
    let transID = null; // 위치로 정류장ID 찾기
    for (const item of transRes.result.lane) {
        if (item.stationClass == 1) {
            transID = item; // 위치로 정류장ID 찾기
            break;
        }
    }
   
    url = `https://api.odsay.com/v1/api/busStationInfo?apiKey=${odsayKey}&lang=0&stationID=${transID.stationID}`;
    transSch = await fetch(url); // 검색
    transRes = await transSch.json(); // 나온값 json으로 파싱
    const transData = transRes.result;
    let cityCode = transData.stationCityCode; // 도시코드
    const localstID = transData.localStationID; // 정류장ID
    const stName = transData.stationName // 정류장 이름
    const arsID = transData.arsID.replace("-","");
    let [dbresult] = [];
    const laneList = []; // 버스 노선 리스트
    const sqlQuery = `SELECT nodeID, cityCode FROM walkway.PubTrans_Bus where nodeName like '${stName}' and nodeID like'%${localstID}' and arsID like '${arsID}' ORDER BY IF(do = '경기도\r', 1, 0) LIMIT 1;`;


    if (cityCode != "1000") { // 서울이 아닌 다른지역 버스
        let stationStr = "";
        [dbresult] = await db.query(sqlQuery);
        cityCode = dbresult[0].cityCode;
        stationStr = dbresult[0].nodeID.replace(/[0-9]/g, "");
        for (let index = 0; index < transData.lane.length; index++) {
            const element = transData.lane[index];
            const tmpList = [element.type, element.busNo, element.busDirectionName]; // 타입, 노선번호, 노선 방향

            if (stnNo.includes(element.busNo)) {

                url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoSpcifyRouteBusArvlPrearngeInfoList?serviceKey=${publicKey}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&nodeId=${dbresult[0].nodeID}&routeId=${stationStr + element.busLocalBlID}`;
                const timeSch = await fetch(url); // 검색
                const timeRes = await timeSch.json(); // 나온값 json으로 파싱
                const transData2 = timeRes.response.body.items.item;
                if (Array.isArray(transData2)) { // 값이 2개
                    const arrtimes = [[transData2[0].arrtime, transData2[0].arrprevstationcnt], [transData2[1].arrtime, transData2[1].arrprevstationcnt]];
                    arrtimes.sort((a, b) => a[0] - b[0]);
                    console.log(arrtimes);
                    // tmpList.push(Math.floor(transData2[0].arrtime / 60) + "분 " + transData2[0].arrtime % 60 + "초후");
                    tmpList.push(`${Math.floor(arrtimes[0][0].arrtime / 60)}분 ${arrtimes[0][0].arrtime % 60}초후 [${arrtimes[0][1].arrprevstationcnt}번째 전]`);
                    tmpList.push(`${Math.floor(arrtimes[1][0].arrtime / 60)}분 ${arrtimes[1][0].arrtime % 60}초후 [${arrtimes[1][1].arrprevstationcnt}번째 전]`);
                } else if (transData2 == undefined) { // 도착정보 없음
                    tmpList.push("도착정보없음");
                } else { // 값이 1개
                    // tmpList.push(Math.floor(transData2.arrtime / 60) + "분 " + transData2.arrtime % 60 + "초");
                    tmpList.push(`${Math.floor(transData2.arrtime / 60)}분 ${transData2.arrtime % 60}초후 [${transData2.arrprevstationcnt}번째 전]`);
                }
                laneList.push(tmpList);
            }

        }

    } else {
        url = `http://ws.bus.go.kr/api/rest/stationinfo/getStationByUid?serviceKey=${publicKey}&arsId=${arsID}&resultType=json`;
        const timeSch = await fetch(url); // 검색
        const timeRes = await timeSch.json(); // 나온값 json으로 파싱
        const transData2 = timeRes.msgBody.itemList;
        if(transData2 == null) {
            res.json("err");
        }
        for (let i = 0; i < transData2.length; i++) {
            const element = transData2[i];
            if (stnNo.includes(element.rtNm)) {
                const tmpList = [element.routeType, element.rtNm, element.nxtStn, element.arrmsg1, element.arrmsg2];
                laneList.push(tmpList);
            }
        }
    }

    laneList.sort((a, b) => a[0] - b[0])

    const sendList = [];
    let tmpType = 0;
    for (let index = 0; index < laneList.length; index++) {
        const element = laneList[index];
        if (tmpType != element[0]) {
            tmpType = element[0];
            if (cityCode == "1000") { // 서울시 버스
                sendList.push(busType_seoul[tmpType]);
            } else {
                sendList.push(busType[tmpType]);
            }
        }
        element.shift();
        sendList.push(element);
    }
    // db.end();
    console.log(sendList);

    if (val.alarm == "출발시간") {
        const whenStrList = [];
        let check = true;
        for (let i = val.when-1; i < val.when+2; i++) {
            whenStrList.push(`${i}분`)
        }
        for (const item of sendList) {
            if (Array.isArray(item)) {
                if (whenStrList.includes(item[2].split(' ')[0])) {
                    check = false;
                    res.send(sendList);
                    break;
                }
            }
        }
        if (check) {
            res.send([]);
        }
    } else {
        res.send(sendList);
    }
}


async function schedule3(req, res) { // 출발시간 지하철
    const val = req.body;
    console.log(val);
    let stnKey = null;
    for (const key in val) {
        if (key.includes("png")) {
            stnKey = key;
            break;
        }
    }
    const x = val[stnKey][0][0];
    const y = val[stnKey][0][1];
    const line = stnKey.split(' _ ')[1];
    let url = `https://api.odsay.com/v1/api/pointBusStation?apiKey=${odsayKey}&lang=0&x=${x}&y=${y}&radius=100`;
    let transSch = await fetch(url); // 검색
    let transRes = await transSch.json(); // 나온값 json으로 파싱
    let transID = null; // 위치로 정류장ID 찾기
    for (const item of transRes.result.lane) {
        if (item.stationClass == 2) {
            transID = item; // 위치로 역찾기
            break;
        }
    }

    url = `http://swopenAPI.seoul.go.kr/api/subway/${metroKey}/json/realtimeStationArrival/0/100/${transID.stationName}`;
    console.log(url);

    const metroSch = await fetch(url); // 검색
    const metroRes = await metroSch.json(); // 나온값 json으로 파싱

    const metroLength = metroRes.total; // 데이터 갯수

    if (metroLength == 0) {
        console.log("typeGroups");
        res.send("err");
        return;
    }
    const metroData = metroRes.realtimeArrivalList; // 결과값
    const typeGroups = {}; // 노선별 그룹
    let upArr = []; //상행
    let downArr = []; //하행
    let downObj = {};
    let str = ''; // 방면

    metroData.forEach(metro => {
        const type = metro.subwayId;
        str = metro.trainLineNm.split("-");
        str = str[1].replace("방면", "");
        str = str.replace("(특급)", "");
        str = str.replace("(급행)", "");
        str = str.trim();

        if (line == metroType[type] && !typeGroups[metroType[type]]) {
            typeGroups[metroType[type]] = [];
            typeGroups[metroType[type]].push(str + ' - 상행');
        }

        // const tmpArr = [metroType[type], +metro.ordkey.substr(2, 3), metro.bstatnNm, metro.arvlMsg2, metro.btrainNo, metro.recptnDt];
        const tmpArr = [metroType[type], +metro.ordkey.substr(2, 3), metro.bstatnNm, metro.arvlMsg2];

        if (metro.updnLine == '상행' && line == metroType[type]) {
            upArr.push(tmpArr);
        } else if (metro.updnLine == '하행' && line == metroType[type]) {
            if (!downObj[metroType[type]]) {
                downObj[metroType[type]] = str + ' - 하행';
            }
            downArr.push(tmpArr);
        }
    });

    upArr.sort((a, b) => a[1] - b[1]);
    downArr.sort((a, b) => a[1] - b[1]);



    upArr.forEach(arr => {
        const tmpArr = [...arr];
        tmpArr.shift();
        typeGroups[arr[0]].push(tmpArr);
    });

    for (const key in typeGroups) {
        if (typeGroups.hasOwnProperty(key)) {
            typeGroups[key].push(downObj[key]);
        }
    }

    downArr.forEach(arr => {
        const tmpArr = [...arr];
        tmpArr.shift();
        typeGroups[arr[0]].push(tmpArr);
    });
    console.log(typeGroups);

    const whenStrList = [];
    let check = true;
    for (let i = val.when-1; i < val.when+2; i++) {
        whenStrList.push(i);
    }
    if (( val[stnKey][1][0] == '상행' && whenStrList.includes(upArr[0][1]) ) || ( val[stnKey][1][0] == '하행' && whenStrList.includes(downArr[0][1]) )) {
        check = false;
        res.send(typeGroups);
    } else {
        res.send([]);
    }
}

export default { schedule, schedule2, schedule3 };
