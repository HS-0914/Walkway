import dbex from './db.js';

async function login(req, res) {

    const { login_id } = req.params;
    const { password } = req.params;
    const db = await dbex.con;

    // 로그인 라우트
    try {
        const [rows] = await db.execute('SELECT * FROM User WHERE login_id = ? AND password = ?', [login_id, password]);

        if (rows.length > 0) {
            var tmp = rows[0];
            res.json([tmp.id, tmp.login_id, tmp.password, tmp.name]);
        } else {
            console.log('로그인 실패. 유효하지 않은 자격 증명입니다.');
            res.status(401).json('로그인 실패. 유효하지 않은 자격 증명입니다.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json('서버 에러');
    }
    // db.end();
}

async function signup(req, res) {
    const { login_value } = req.params;
    const login_Arrangement = JSON.parse(login_value); //문자열화된 배열 -> 배열로 바꿔줌.
    const db = await dbex.con;
    var sendmsg = "";

    try {
        // 사용자 중복 확인
        var [existingUsers] = await db.execute('SELECT * FROM User WHERE login_id = ? OR phone_number = ?', [login_Arrangement[0], login_Arrangement[3]]);

        if (existingUsers.length > 0) {
            console.log('이미 존재하는 사용자입니다.');
            return res.status(400).json('이미 존재하는 사용자입니다.');
        }

        // 새로운 사용자 추가
        const [result] = await db.execute('INSERT INTO User (login_id, password, name, phone_number) VALUES (?, ?, ?, ?)', login_Arrangement);
        
        // db.end();

        if (result.affectedRows === 1) {
            console.log('회원가입 성공!');
            return res.json(login_Arrangement.slice(0, -1)); //전화번호 빼고 반환
        } else {
            console.log('회원가입 에러!');
            return res.status(500).json({ message: '회원가입 실패. 서버 에러.' });
        }
        
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: '서버 에러' });
    }

};
export default { login , signup };