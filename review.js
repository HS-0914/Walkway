import express from 'express';
import dbex from './db.js';

const app = express();
app.use(express.json());

async function reviews(req, res) {
    const db = await dbex.con;
    try {
        var { Custom_id, page } = req.params;
        var page = (Number(page) - 1) * 10;
        const [rows, fields] = await db.execute(`SELECT id, title, User_id FROM Review WHERE Custom_id = ? LIMIT ${page}, 10`, [Custom_id]);

        const filteredResults = rows.map(item => {
            return [ item.id, item.title, item.User_id ];
        });

        res.send(filteredResults);
        console.log(filteredResults);
        
    } catch (error) {
        console.error("쿼리 실행 실패: ", error);
        res.status(500).send('Internal Server Error');
    }
}           //Custom_id, page값 가져와서 id, title, User_id값 보내기 

async function reviewsS(req, res) {
    const db = await dbex.con;
    try {
        const { id, title, User_id } = req.params;

        const [rows, fields] = await db.execute(
            `SELECT id, title, User_id, description FROM Review WHERE id = ? AND title = ? AND User_id = ?`,
            [id, title, User_id]
        );
        const resultList = rows.map(item => {
            return [ item.id, item.title, item.User_id, item.description ];
        });

        res.send(resultList);
        console.log(resultList);

    } catch (error) {
        console.error("쿼리 실행 실패: ", error);
        res.status(500).send('Internal Server Error');
    }       //id, title, User_id값 불러와서 id, title, User_id, description 보내기
}

async function reviewsService(req, res) {
    const db = await dbex.con;
    try {
        const { title, description, Custom_id, User_id } = req.params;

        // 데이터베이스에 데이터 삽입
        await db.execute(
            'INSERT INTO Review (title, description, Custom_id, User_id) VALUES (?, ?, ?, ?)',
            [title, description, Custom_id, User_id]
        );
        res.json({ message: '데이터가 성공적으로 저장되었습니다.' });
    } catch (error) {
        console.error('데이터베이스 저장 실패:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}      //title, description, Custom_id, User_id값 불러와서 저장

async function reviewsServicemodify(req, res) {
    const db = await dbex.con;
    try {
        const { title, description, Custom_id, User_id, id } = req.params;

        // 데이터베이스에 데이터 수정
        await db.execute(
            'UPDATE Review SET title = ?, description = ? WHERE Custom_id = ? AND User_id = ? AND id = ?',
            [title, description, Custom_id, User_id, id]
        );
        res.json({ message: '데이터가 성공적으로 수정되었습니다.' });
    } catch (error) {
        console.error('데이터베이스 수정 실패:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}       //title, description, Custom_id, User_id, id값 불러와서 title, description 수정

async function reviewsdelete(req, res) {
    const db = await dbex.con;
    try {
        const { title, User_id, id } = req.params;
        // 데이터베이스에서 데이터 삭제
        await db.execute(
            'DELETE FROM Review WHERE title = ? AND User_id = ? AND id = ?',
            [title, User_id, id]
        );
        res.json({ message: '데이터가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        console.error('데이터베이스 삭제 실패:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

export default { reviews , reviewsS , reviewsService , reviewsServicemodify , reviewsdelete };

// 사용자한테 받는 값 : 경로 아이디, 페이지 번호(한 10개씩 조회하기위해)
// 글아이디, 제목, 작성자 불러와야  ==  id, title, User_id 가져오기 
// 글목록, 글세부정보(제목,내용,사용자이름), 글등록, 글수정 , 글삭제