import express from 'express';
const app = express();
import bcrypt from 'bcrypt';
//비밀번호 해싱을 위한 모듈 
// body-parser를 사용하여 POST 데이터 파싱
import connection from './config/db.js';

// db.js 모듈 가져오기
app.use(express.urlencoded({ extended: true }));


// 로그인 페이지 렌더링
app.get('/login', (req, res) => {
  res.render('login', { pageTitle: 'Login' });
});

// 회원가입 페이지 렌더링
app.get('/join', async (req, res) => {
  res.render('join', {pageTitle: 'Join'});

});


// // 회원가입 데이터 삽입 api
// app.post('/join', async function (req, res) {
//   // const body = req.body;
//   try {
//     const body = req.body;  
//      // 필요한 데이터가 있는지 확인
//     if (!body || !body.password) {
//       console.log('Invalid form data. Password is missing.');
//       res.status(400).send('Bad Request');
//       return;
//     }

//     // 비밀번호 해싱
//     const hashedPassword = await bcrypt.hash(body.password, 10);

//     // 데이터베이스에 회원 정보 삽입
//     const sql = 'INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)';
//     const params = [body.id, body.username, body.email, hashedPassword];

//     // 데이터베이스 연결 확인
//     if (!req.conn) {
//       console.log('Database connection is not established.');
//       res.status(500).send('Internal Server Error');
//       return;
//     }

//     req.conn.query(sql, params, function (err) {
//       if (err) {
//         console.log('Query is not executed. Insert failed...\n' + err);
//         res.status(500).send('Internal Server Error');
//         return;
//       }

//       console.log('User registered successfully');
//       res.redirect('/users'); // 회원가입 성공 시 회원 목록 페이지로 리다이렉트
//     });
//   } catch (error) {
//     console.error('Error hashing password: ' + error.message);
//     res.status(500).send('Internal Server Error');
//   }
// });

// // 회원 목록 조회 API
// app.get('/users', function (req, res) {
//   const sql = 'SELECT * FROM users';
//   req.conn.query(sql, function (err, rows, fields) {
//     if (err) console.log('Query is not executed. Select failed...\n' + err);
//     else res.render(__dirname + '/view/users.ejs', { list: rows });
//   });
// });

connection.query('SELECT * FROM users', (err, results) => {
  if (err) {
    console.error('Error executing SELECT query: ' + err.stack);
    return;
  }
  console.log('Query results:', results);
});


// 
app.post('/join', (req, res) => {
  console.log("registeruser");
  const { id, username, email, password} = req.body;
  console.log(`Received data: ${JSON.stringify(req.body)}`);
  // SQL 쿼리 작성
  const sql = `INSERT INTO users (id, username, email, password) VALUES (?, ?,?, ?)`;
  // 쿼리 실행
  connection.query(sql, [id,username, email, password], (error, userResults) => {
      if (error) {
          console.error(error); // 에러 메시지를 콘솔에 출력
          res.status(500).send(error.message);
          return;
      }
      // // 생성된 회원의 ID
      // const id = userResults.insertId;
      // // userStatus 테이블에 데이터 삽입
      // const userStatusSql = `INSERT INTO userStatus (user_id, status, clinic, doctor_name, createdAt) VALUES (?, ?, ?, ?, ?)`;
      // // 예시 데이터 - 실제 상황에 맞게 수정 필요
      // const status = 0; // 상태 코드
      // const clinic = "A1"; // 진료실
      // const doctorName = "홍길동"; // 의사 이름
      // connection.query(userStatusSql, [newuserId, status, clinic, doctorName, getDatetime()], (userStatusError, userStatusResults) => {
      //     if (userStatusError) {
      //         res.status(500).send(userStatusError.message);
      //         return;
      //     }
      res.status(200).send('신규 회원이 등록되었습니다.');
      });
      
  
});







// 이벤트 디테일
app.get('/events', (req, res) => {
  res.render('events-1', { pageTitle: 'Details' });
});

// 좌석 보고 예매하는 페이지
app.get('/seats', (req, res) => {
  res.render('seats', { pageTitle: 'Seats'});
});

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  // 렌더링할 데이터를 객체로 전달
  const data = {
    pageTitle: '티켓팅 웹사이트',
    events: [
      { name: '이벤트1', date: '2024-01-13', title: '길' },
      { name: '이벤트2', date: '2024-06-30', title: '용환이의 생일잔치' },
      // 추가 이벤트들...
    ]
  };

  // index.ejs 템플릿을 렌더링하고, 데이터를 전달
  res.render('index', data);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("백엔드 API 서버가 켜졌어요!!!");
});
