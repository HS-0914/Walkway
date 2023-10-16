import db from './db.js';

async function login(req, res) {

    const { login_id } = req.params;
    const { password } = req.params;
    const con = await db.con;

    // 로그인 라우트
    try {
        const [rows] = await con.execute('SELECT * FROM User WHERE login_id = ? AND password = ?', [login_id, password]);

        if (rows.length > 0) {
            res.json({ message: '로그인 성공!', user: rows[0] });
        } else {
            res.status(401).json({ message: '로그인 실패. 유효하지 않은 자격 증명입니다.' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: '서버 에러' });
    }

    res.send("loginnnnnn");
}

async function signup(req, res) {
    const { login_value } = req.params;
    const login_Arrangement = JSON.parse(login_value); //문자열화된 배열 -> 배열로 바꿔줌.
    const con = await db.con;

    try {
        // 사용자 중복 확인
        const [existingUsers] = await con.execute('SELECT * FROM User WHERE login_id = ?', [login_Arrangement[0]]);

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: '이미 존재하는 사용자입니다.' });
        }

        // 새로운 사용자 추가
        const [result] = await con.execute('INSERT INTO User (login_id, password, name, phone_number) VALUES (?, ?, ?, ?)', login_Arrangement);

        if (result.affectedRows === 1) {
            return res.json({ message: '회원가입 성공!' });
        } else {
            return res.status(500).json({ message: '회원가입 실패. 서버 에러.' });
        }
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: '서버 에러' });
    }
};
export default { login , signup };