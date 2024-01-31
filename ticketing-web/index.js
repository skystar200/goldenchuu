  const express = require('express');
  const app = express();
  const path = require('path');
  const { fileURLToPath } = require('url');
  const { dirname } = require('path');
  const bcrypt = require('bcrypt');
  const connection = require('./config/db.js');
  const session = require('express-session');
  const bodyParser = require('body-parser');
  const ejs = require('ejs');
  //socket.io 설정
  const http = require('http');
  const socketIO = require('socket.io');
  const Server = http.createServer(app);
  const io = socketIO(Server);
  // const { popSeat } = require('./config/redis');


  const axios = require('axios');

  app.use('/public/js/socket.io-client', express.static(path.join(__dirname, 'node_modules/socket.io-client/dist')));
  // CORS 설정
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    next();
  }); 

  //세션 초기화
  app.use(session({
    secret: 'my key', // 암호화에 사용되는 비밀 키, 보안에 중요
    resave: false,
    saveUninitialized: true,
  }));

  const cors = require('cors');
  app.use(cors());

  // 좌석예매 /seats 관련
  // 좌석 정보
  app.use(express.static('public'));
  //미들웨어를 사용하여 정적 파일을 서빙할때 MIME 타입을 설정할 수 있다.
  app.use('/public', express.static(path.join(__dirname, 'public'), { 
    setHeader: (res, path, stat) => {
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      }
    },
  }));


  const seats = [];
  const selectedSeats = new Set();
  // 좌석 초기화
  const totalSeats = 50;
  for (let i = 1; i <= totalSeats; i++) {
    seats.push({
      id: i,
      status: 'available', // 'available', 'selected', 'sold'
    });
  }

  app.get('/seats', (req, res) => {
    res.render('seats', { pageTitle: '좌석' });
  });


  // 정적 파일 서빙
  // app.use('/public', express.static(path.join(__dirname, 'public')));
  io.on('connection', (socket) => {

    // 클라이언트에 좌석 정보 전송
    socket.emit('seats', seats);

    // 좌석 선택 이벤트 처리
    socket.on('seatSelected', (seatId) => {
      const selectedSeat = seats.find((seat) => seat.id === seatId);

      if (selectedSeat && selectedSeat.status === 'available') {
        selectedSeat.status = 'selected';
        selectedSeats.add(seatId);

        // 클라이언트에 선택된 좌석 정보 전송
        io.emit('seats', seats);
      }
    }); 

    //예매 완료 이벤트 처리
    socket.on('checkout', () => {
      // 여기에서 결제 로직을 처리할 수 있습니다.

      // 판매 완료된 좌석 상태 업데이트
      selectedSeats.forEach((seatId) => {
        const soldSeat = seats.find((seat) => seat.id === seatId);
        if (soldSeat) {
          soldSeat.status = 'sold';
        }
      });

      // 클라이언트에 업데이트된 좌석 정보 전송
      io.emit('seats', seats);

      // 선택된 좌석 초기화
      selectedSeats.clear();
    });
  });


  // 로그인 페이지 렌더링
  app.get('/login', (req, res) => {
    res.render('login', { pageTitle: 'Login' });
  });

  // JSON 파싱을 위한 미들웨어
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

//로그인
  app.post('/login', (req, res) => {
    const { userName, password } = req.body;

    // 데이터베이스에서 사용자 정보 확인 및 로그인 처리
    const query = 'SELECT * FROM users WHERE userName = ? AND password = ?';

    connection.query(query, [userName, password], (err, results) => {
      if (err) {
        console.error('쿼리 오류:', err);
        res.json({ success: false, message: '로그인 중 오류가 발생했습니다.' });
        return;
      }

      if (results.length > 0) {
        // 세션 객체 초기화
        req.session = req.session || {};
        // 로그인 성공 시 사용자 정보를 세션에 저장
        req.session.user = {
          userId: results[0].userId,
          // password: results[0].password,
          email: results[0].email,
          userName: results[0].userName,
          phone: results[0].phone
          
          
          // 다른 필요한 정보들을 추가할 수 있음
        };
        res.json({ success: true, message: '로그인이 완료되었습니다.' });
        
      } else {
        res.json({ success: false, message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
      }

    });
  });
  //로그아웃
  app.get('/logout', (req, res) => {
    // 세션에서 사용자 정보 삭제
    req.session.destroy((err) => {
      if (err) {
        console.log('세션 삭제 중 에러 발생:', err);
      }
      // 로그아웃 후 로그인 페이지로 리다이렉션
      res.redirect('/login');
    });
  });

  // 회원가입 페이지 렌더링
  app.get('/join', async (req, res) => {
    res.render('join', {pageTitle: 'Join'});

  });

  connection.query('SELECT * FROM users', (err, results) => {
    if (err) {
      console.error('Error executing SELECT query: ' + err.stack);
      return;
    }
    console.log('Query results:', results);
  });


  // 회원가입
  app.post('/join', (req, res) => {
    console.log("registeruser");
    const { userId, password, email, userName, phone} = req.body;
    console.log(`Received data: ${JSON.stringify(req.body)}`);
    // SQL 쿼리 작성
    const sql = `INSERT INTO users (userId, password, email, userName, phone) VALUES (?, ?,?, ?,?)`;
    // 쿼리 실행
    connection.query(sql, [userId, password, email, userName, phone], (error, userResults) => {
        if (error) {
            console.error(error); // 에러 메시지를 콘솔에 출력
            res.status(500).send(error.message); 
            return;
        }
        res.status(200).send('신규 회원이 등록되었습니다.');
        res.redirect('/login');
        });
        
    
  });


  // 이벤트 디테일
  app.get('/events', (req, res) => {
    res.render('events-1', { pageTitle: 'Details' });
  });

  app.get('/bookTicket', (req, res) => {
    // 여기서 로그인 상태를 확인
    if (req.session && req.session.user) {
      // 로그인 상태일 경우 예매 페이지로 리다이렉션
      res.redirect('/seats');
    } else {
      // 로그인되어 있지 않을 경우 로그인 페이지로 리다이렉션
      res.redirect('/login');
    }
  });




  // EJS 템플릿 엔진 설정
  app.engine('ejs', ejs.renderFile);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));





  app.get('/', (req, res) => {
    // 렌더링할 데이터를 객체로 전달
    const data = {
      pageTitle: '티켓팅 웹사이트',
      events: [
        { name: '이벤트1', date: '2024-01-13', title: '길' },
        { name: '이벤트2', date: '2024-06-30', title: '"우쥬"대스타의 팬미팅' },
        // 추가 이벤트들...
      ],
      user: req.session.user,
    };

    // index.ejs 템플릿을 렌더링하고, 데이터를 전달
    res.render('index', data);
  });



// app.post('/pop-seat',(req, res) => {
//   popSeat()
//     .then(result => {
//       console.log(`Seat ${result} popped from Redis.`);
//       // 결과를 사용하여 다른 작업을 수행합니다.
//       res.status(200).send(`Seat ${result} popped from Redis.`);
//     })
//     .catch(error => {
//       console.error('Failed to pop seat from Redis:', error);
//       // 오류를 처리합니다.
//       res.status(500).send('Failed to pop seat from Redis.');
//     });
// });
app.post('/pop-seat', async (req, res) => {
  try {
    const selectedSeat = req.body.seat; // 클라이언트에서 선택한 좌석
    const sector = selectedSeat.split('-')[0]; // 좌석에서 섹터 부분 추출
    const response = await axios.get(`http://localhost:5000/get-seat-data/${sector}`);
    
    if (response.status === 200) {
      const data = response.data;
      console.log('Data from Flask Server:', data);
      // 여기서 좌석 데이터를 사용하여 다른 작업을 수행할 수 있습니다.
      res.status(200).json(data);
    } else {
      console.error('Failed to get seat data from Flask Server.');
      res.status(500).send('Failed to get seat data from Flask Server.');
    }
  } catch (error) {
    console.error('Error sending get-seat-data request to Flask Server:', error);
    res.status(500).send('Error sending get-seat-data request to Flask Server.');
  }
});

app.get('/get-seat-data/:seat', async (req, res) => {
  try {
    const seat = req.params.seat;
    const response = await axios.get(`http://localhost:5000/get-seat-data/${seat}`);
    const data = response.data;
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching seat data:', error);
    res.status(500).send('Error fetching seat data.');
  }
});

 



  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log("백엔드 API 서버가 켜졌어요!!!");
  });
