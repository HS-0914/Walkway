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