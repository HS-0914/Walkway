const odsayKey = '0QNZgti0UA7t0YRwd3T7Qs2pyfFuFAHK6ZrPCSV/KS4'; // odsay api키
const publicKey = '32c8O%2F2CZv4jgj8cvCaCc7vhw9VOZ6ntxQz77NBxnqUdp1i0fUoCB2sQHZGgY8PusgYc26%2BGftipAB512U4KJg%3D%3D'; // 공공데이터 api 키

export async function schedule(req, res) {
    const { x } = req.params;
    const { y } = req.params;
    let url = `https://apis.data.go.kr/1613000/BusSttnInfoInqireService/getCrdntPrxmtSttnList?serviceKey=${publicKey}&_type=json&gpsLati=${y}&gpsLong=${x}`;
    const locSch = await fetch(url);
    const locRes = await locSch.json();
    const locData = locRes.response.body.items.item[0];

    url = `https://apis.data.go.kr/1613000/ArvlInfoInqireService/getSttnAcctoArvlPrearngeInfoList?serviceKey=${publicKey}&_type=json&cityCode=${locData.citycode}&nodeId=${locData.nodeid}`;
    const timeSch = await fetch(url);
    const timeRes = await timeSch.json();
    let timeData;
    if (timeRes.response.body.totalCount > 0) {
        timeData = await timeRes.response.body.items.item;
    }
    else {
        timeData = false;
    }
    const sendArr = [];
    if(timeData) {
        for (let i = 0; i < timeData.length; i++) {
            const element = Object.values(timeData[i]);
            const tmpArr = [element[5], Math.ceil(element[1]/60), element[0]]; // 버스 번호, 예상 시간(초),  남은 정류장 수
      
            sendArr.push(tmpArr);
        }
    }
    else {
        sendArr.push(-1);
    }
    // sendArr.sort(function(a, b) {
    //     return a[1] - b[1];
    // });
    sendArr.sort((a, b) => a[1] - b[1]);
    console.log(sendArr);
    res.json(sendArr);
}