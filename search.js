const f = require('node-fetch')();

const odsayKey = '0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4'; // odsay api키
const publicKey = '32c8O%2F2CZv4jgj8cvCaCc7vhw9VOZ6ntxQz77NBxnqUdp1i0fUoCB2sQHZGgY8PusgYc26%2BGftipAB512U4KJg%3D%3D'; // 공공데이터 api 키
const metroKey = '7a4b547161677564373349725a5a5a' //서울 지하철 키

exports.searchTrans = async function (req, res) {
    const { value } = req.params;
    var url = `https://api.odsay.com/v1/api/searchStation?apiKey=${odsayKey}&lang=0&stationName=${value}&stationClass=1&displayCnt=10`;
    let transSch = await f(url); // 검색
    let transRes = await transSch.json(); // 나온값 json으로 파싱
    var transData = transRes.result.station;

    const doList = [];
    const schList = []; // 정류장

    let tmpList = [];
    let tmpdo = "지역"

    for (var index = 0; index < transData.length; index++) { //도 리스트
        const element = transData[index];
        doList.push(element.do);
    }
    for (var index = 0; index < transData.length; index++) { // 버스정류장 정보(이름, ars, 버스리스트)
        const element = transData[index];
        if (tmpdo != doList[index]) {
            schList.push(doList[index]);
            tmpdo = doList[index];
        }
        tmpList = [element.stationName, element.arsID, element.stationDirectionName, element.stationID];
        schList.push(tmpList);
        tmpList = [];
    }
    console.log(schList);
    res.json(schList);
}

exports.searchTrans2 = async function (req, res) {
    const db = await require('./db');
    const { value } = req.params;

    const schList2 = []; // 지하철

    if (value.charAt(value.length - 1) == "역") {
        let [dbresult] = [];
        if (value != "서울역") {
            [dbresult] = await db.query(`SELECT * FROM pubtrans_metro WHERE nodeName like '${value.substr(0, value.length - 1)}'`);
        }
        else {
            [dbresult] = await db.query(`SELECT * FROM pubtrans_metro WHERE nodeName like '${value}'`);
        }
        for (let index = 0; index < dbresult.length; index++) {
            const element = dbresult[index];
            tmpList = [element.lineName, element.nodeName, element.nodeID, "favorite_e.png"];
            schList2.push(tmpList);
            tmpList = [];
        }
    }
    console.log(schList2);
    res.json(schList2);
}

exports.busgetTime = async function (req, res) {


    const db = await require('./db');

    const { stID } = req.params;

    let url = `https://api.odsay.com/v1/api/busStationInfo?apiKey=${odsayKey}&lang=0&stationID=${stID}`;
    let transSch = await f(url); // 검색
    let transRes = await transSch.json(); // 나온값 json으로 파싱
    const transData = transRes.result;
    let cityCode = transData.stationCityCode; // 도시코드
    const localstID = transData.localStationID; // 정류장ID
    const stName = transData.stationName // 정류장 이름
    let [dbresult] = [];
    const laneList = []; // 버스 노선 리스트
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

    // csv 데이터오류로 인한 특정 정류장의 중복된 경기도 제외
    const sqlQuery = `SELECT nodeID, cityCode FROM walkway.pubtrans_bus where nodeName like '${stName}' and nodeID like'%${localstID}' ORDER BY IF(do = '경기도', 1, 0) LIMIT 1;`;

    if (cityCode == "1000") { // 서울시 버스

    } else { // 그외 버스
        let stationStr = "";
        [dbresult] = await db.query(sqlQuery);
        cityCode = dbresult[0].cityCode;
        stationStr = dbresult[0].nodeID.replace(/[0-9]/g, "");
        for (let index = 0; index < transData.lane.length; index++) {
            const element = transData.lane[index];
            const tmpList = [element.type, element.busNo, element.busDirectionName]; // 타입, 노선번호, 노선 방향

            url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoSpcifyRouteBusArvlPrearngeInfoList?serviceKey=${publicKey}&pageNo=1&numOfRows=10&_type=json&cityCode=${cityCode}&nodeId=${dbresult[0].nodeID}&routeId=${stationStr + element.busLocalBlID}`;
            const timeSch = await f(url); // 검색
            const timseRes = await timeSch.json(); // 나온값 json으로 파싱
            const transData2 = timseRes.response.body.items.item;
            if (Array.isArray(transData2)) { // 값이 2개
                const arrtimes = [transData2[0].arrtime, transData2[1].arrtime];
                arrtimes.sort((a, b) => a - b);
                tmpList.push(Math.floor(transData2[0].arrtime / 60) + "분 " + transData2[0].arrtime % 60 + "초");
                tmpList.push(Math.floor(transData2[1].arrtime / 60) + "분 " + transData2[1].arrtime % 60 + "초");
            } else if (transData2 == undefined) { // 도착정보 없음
                tmpList.push("도착정보없음");
            } else { // 값이 1개
                tmpList.push(Math.floor(transData2.arrtime / 60) + "분 " + transData2.arrtime % 60 + "초");
            }
            laneList.push(tmpList);
        }
    }
    laneList.sort((a, b) => a[0] - b[0])

    const sendList = [];
    let tmpType = 0;
    for (let index = 0; index < laneList.length; index++) {
        const element = laneList[index];
        if (tmpType != element[0]) {
            tmpType = element[0];
            sendList.push(busType[tmpType]);
        }
        element.shift();
        sendList.push(element);
    }
    console.log(sendList);
    res.send(sendList);
}

exports.metrogetTime = async function (req, res) {
    // [왼쪽: 상행, 오른쪽: 하행]
    /*  1 ~ 9 : 1 ~ 9호선
        A : 공항철도
        B : 분당선
        E : 에버라인 (용인경전철)
        G : 경춘선
        I : 인천1호선
        I2 : 인천2호선
        K : 경의중앙선
        KK : 경강선
        S : 신분당선
        SU : 수인선
        SB : 수인분당선
        U : 의정부경전철
        UI : 우이신설경전철
        M : 자기부상선
        W : 서해선
        GG : 김포 골드
*/
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

    // const db = await require('./db');

    const { stName } = req.params;

    const url = `http://swopenAPI.seoul.go.kr/api/subway/${metroKey}/json/realtimeStationArrival/0/100/${stName}`;
    console.log(url);

    const metroSch = await f(url); // 검색
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