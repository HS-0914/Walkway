import dbex from './db.js';

async function reviews(req, res) {
    const db = await dbex.con;
    try {
        const { Custom_id, page } = req.params;

        // console.log(`Custom_id: ${Custom_id}, page: ${page}`);
        
        const [rows, fields] = await db.execute("SELECT id, title, User_id FROM Review WHERE Custom_id = ? LIMIT ?, ?", [Custom_id, (page - 1) * 10, 10]);

        const filteredResults = rows.map(item => {
            return { id: item.id, title: item.title, User_id: item.User_id };
        });

        res.send(filteredResults);
        console.log(filteredResults);
        
    } catch (error) {
        console.error("쿼리 실행 실패: ", error);
        res.status(500).send('Internal Server Error');
    } finally {
        db.end();
    }
}

export default { reviews };

// 사용자한테 받는 값 : 경로 아이디, 페이지 번호(한 10개씩 조회하기위해)
// 글아이디, 제목, 작성자 불러와야  ==  id, title, User_id 가져오기 