    // search.js=============================
    // fetch(url)
    //     .then((result) => result.json())
    //     .then((data) => {
    //         var st = data.result.station;
    //         for (let i = 0; i < st.length; i++) {
    //             if((exceptArr.indexOf(st[i].cityName)) == -1){ // 예외 배열에 없음
    //                 var sendData = {
    //                     "stationName" : st[i].stationName,
    //                     "cityName" : st[i].cityName,
    //                     "arsID" : st[i].arsID.replace('-',''),
    //                     "CID" : null,
    //                     "localStationID" : null
    //                  };
    //                  arr.push(sendData)
    //             }
    //         }
    //         for (let i = 0; i < arr.length; i++) {
    //             var queryStr = `SELECT citycode FROM city_code WHERE cityname like '%${arr[i].cityName}%'`;
    //             con.query(queryStr, (err, row) => {
    //                 if (err) throw err;
    //                 arr[i].CID = row[0].citycode;
    //                 console.log(arr[i].CID)
    //             });
    //         }
    //         console.log(arr);
    //         res.json(arr);
    //         con.end();
        // });

        //==================================================================0522제거

        /*
         var url = `https://api.odsay.com/v1/api/searchStation?apiKey=${odsayKey}&lang=0&stationName=${value}&stationClass=1`;
    var seoulData = []

    const placeSch = await fetch(url); // 검색
    const placeRes = await placeSch.json(); // 나온값 json으로 파싱
    var st = placeRes.result.station;
    for (let i = 0; i < st.length; i++) { // db에서 도시 이름과 맞는 도시코드 찾기
        console.log(st)
        const cityname = st[i].cityName;
        const queryStr = `SELECT citycode FROM city_code WHERE cityname like '%${cityname}%'`
        let [row] = await con.query(queryStr);
        if(row[0] === undefined){
            if(st[i].CID == 1000){ //서울
                var data = {
                    stationName : st[i].stationName,
                    arsID : st[i].arsID.replace('-', '')
                }
                seoulData.push(data);
            } 
            placeRes.result.station[i].CID = 0; // 도시 코드 없음
        } else {
            placeRes.result.station[i].CID = row[0].citycode;
        }
    }
    var filteredData = placeRes.result.station.filter(st => {
            return !((st.CID == 0) || (st.arsID == '')); // 도시 코드 있는것만 필터링
        });
    const fetchPromises = filteredData.map(async st => { // 도시 코드와 고유번호로 위치 ID찾기
        const CID = st.CID;
        console.log(CID)
        var arsID = st.arsID.replace('-', ''); // arsid에서 중간에 - 제거
        if (arsID.slice(0, 1) == '0') { // arsid 앞자리가 0이면 0제거
            arsID = arsID.slice(1);
        }
        url = `http://apis.data.go.kr/1613000/BusSttnInfoInqireService/getSttnNoList?serviceKey=${publicKey}&_type=json&cityCode=${CID}&nodeNo=${arsID}`
        const IDSch = await fetch(url);
        const IDRes = await IDSch.json();
        console.log(IDRes.response.body)
        const IDData = IDRes.response.body.items.item.nodeid;
        return {
            stationName: st.stationName,
            cityName: st.cityName,
            arsID: arsID,
            CID: st.CID,
            localStationID: IDData
        }
    });
    var re2 = await Promise.all(fetchPromises);
    if(seoulData.length > 0) { // 서울 합치기
        re2 = re2.concat(seoulData);
    }
    console.log(re2)
    res.json(re2);
        */
        //==================================================================

/*
var url = `https://api.odsay.com/v1/api/searchStation?apiKey=${odsayKey}&lang=0&stationName=${value}&stationClass=1&displayCnt=20`;
    let transSch = await fetch(url); // 검색
    let transRes = await transSch.json(); // 나온값 json으로 파싱
    var transData = transRes.result.station;

    const doList = [];
    const schList = []; // 정류장
    const schList2 = []; // 지하철

    let tmpList = [];
    let tmpdo = "지역"

    for (var index = 0; index < transData.length; index++) { //도 리스트
        const element = transData[index];
        doList.push(element.do);
    }
    for (var index = 0; index < transData.length; index++) { // 버스정류장 정보(이름, ars, 버스리스트)
        const element = transData[index];
        if(tmpdo != doList[index]) {
            schList.push(doList[index]);
            tmpdo = doList[index];
        }
        tmpList.push(element.stationName);
        tmpList.push(element.arsID);
        tmpList.push(element.stationDirectionName);

        const busList = [];
        console.log(element);
        for (let index = 0; index < element.businfo.length; index++) { // 버스정류장의 버스리스트
            const element2 = element.businfo[index];
            if(element2.busclass != "3") {
                const tmpbusList = [element2.busClass, element2.busLocalBlID, element2.busNo]
                busList.push(tmpbusList);
            }
        }
        tmpList.push(busList);
        
        schList.push(tmpList);
        tmpList = [];
    }
    if(value.charAt(value.length-1) == "역") {
        let [ dbresult ] = [];
        if(value != "서울역") {
            [ dbresult ] = await db.query(`SELECT * FROM pubtrans_metro WHERE nodeName like '${value.substr(0, value.length-1)}'`);
        }
        else {
            [ dbresult ] = await db.query(`SELECT * FROM pubtrans_metro WHERE nodeName like '${value}'`);
        }
        for (let index = 0; index < dbresult.length; index++) {
            const element = dbresult[index];
            tmpList = [element.lineName, element.nodeName, element.nodeID, "favorite_e.png"];
            schList2.push(tmpList);
            tmpList = [];
        }
    }
    // const queryStr = `SELECT * FROM pubtrans_bus WHERE nodeName like '%${value}%'`
    // let [row] = await con.query(queryStr);
    // console.log(schList);


//=====================================   
// =========================0522 제거
//==========================================
    const sendList = [schList, schList2.sort()];
    console.log(sendList);   
    res.json(sendList);


*/