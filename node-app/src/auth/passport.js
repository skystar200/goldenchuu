
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const connection = require('../../db/db'); // 데이터베이스 연결 설정에 따라 경로 설정 필요


passport.use(new LocalStrategy({
    usernameField: 'userId', // 사용자명 필드의 이름
    passwordField: 'password' // 비밀번호 필드의 이름
}, async (userId, password, done) => {
    try {
        // 데이터베이스에서 사용자 정보 확인
        const query = 'SELECT * FROM users WHERE userId = ?';
        connection.query(query, [userId], async (err, results) => {
            if (err) {
                return done(err);
            }
            if (results.length === 0) {
                return done(null, false, { message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
            }
            const user = results[0];
            // 비밀번호 비교
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return done(null, false, { message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
            }
            return done(null, user);
        });
    } catch (error) {
        return done(error);
    }
}));

// 세션을 위한 직렬화 및 역직렬화
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {

    const query = 'SELECT * FROM users WHERE id = ?';
    connection.query(query, [id], (err, results) => {
        if (err) {
            return done(err);
        }
        const user = results[0];
        done(null, user);
    });
});

module.exports = passport;