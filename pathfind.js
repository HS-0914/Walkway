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
             arr.push(sendData)
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
             arr.push(sendData)
        }
    }
    console.log(arr);
    res.json(arr)
}