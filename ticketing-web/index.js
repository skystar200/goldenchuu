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
  // const jwt = require('jsonwebtoken'); // JWT 토큰 모듈 추가
  const passport = require('./src/auth/passport');
  const axios = require('axios');
  const jwt = require('jsonwebtoken');
  const LocalStrategy = require('passport-local').Strategy;
  const cookieParser = require('cookie-parser');

  // EJS 템플릿 엔진 설정
  app.engine('ejs', ejs.renderFile);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  
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

  // Express 애플리케이션에 Passport 초기화 및 세션 설정
  app.use(require('express-session')({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  // 사용자 인증을 위한 미들웨어 정의
  // function isAuthenticated(req, res, next) {
  //   if (req.cookies && req.cookies.access_token) { // 쿠키가 존재하는지 확인
  //     const accessToken = req.cookies.access_token;
      
  //     try {
  //       // 토큰 검증
  //       const decoded = jwt.verify(accessToken, 'test_key'); // 발급할 때 사용한 비밀 키와 동일해야 함
        
  //       // 토큰에서 추출한 사용자 아이디
  //       const userId = decoded.userId;
  
  //       // 데이터베이스에서 해당 사용자 정보 가져오기
  //       const query = 'SELECT * FROM users WHERE userId = ?';
  //       connection.query(query, [userId], (err, results) => {
  //         if (err) {
  //           console.error('쿼리 오류:', err);
  //           res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
  //           return;
  //         }
  
  //         if (results.length > 0) {
  //           // 사용자 정보가 일치하는 경우
  //           req.user = results[0]; // 요청 객체에 사용자 정보 추가
  //           next(); // 다음 미들웨어로 이동
  //         } else {
  //           // 사용자 정보가 일치하지 않는 경우
  //           res.status(401).json({ success: false, message: '사용자 정보가 일치하지 않습니다.' });
  //         }
  //       });
  //     } catch (error) {
  //       // 토큰이 유효하지 않은 경우
  //       res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
        
  //     }
  //   } else {
  //     res.redirect('/login'); // 쿠키가 없는 경우 로그인 페이지로 리다이렉션
  //   }
  // }

  const cors = require('cors');
  app.use(cors());


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

  //좌석예매 관련

  app.get('/seats', (req, res) => {
    // 페이지 제목을 변수에 저장
    const pageTitle = "좌석";
    // 렌더링 시 pageTitle 변수를 전달
    const user = req.session.user;
    res.render('seats', { pageTitle, user: user });

  });

  // 로그인 페이지 렌더링
  app.get('/login', (req, res) => {
    res.render('login', { pageTitle: 'Login' });
  });

  // JSON 파싱을 위한 미들웨어
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  app.use(cookieParser());

//로그인
  app.post('/login', (req, res) => {
    const { userId, password } = req.body;

    // 데이터베이스에서 사용자 정보 확인 및 로그인 처리
    const query = 'SELECT * FROM users WHERE userId = ? AND password = ?';

    connection.query(query, [userId, password], (err, results) => {
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
          id: results[0].id,
          userId: results[0].userId,
          // password: results[0].password,
          email: results[0].email,
          userName: results[0].userName,
          phone: results[0].phone

        };
        //JWT 토큰 발급
        const accessToken = jwt.sign(req.session.user, 'test_key'); // 토큰에 담길 정보와 비밀 키 전달
        // 발급한 토큰을 쿠키에 저장
        res.cookie('access_token', accessToken, { httpOnly: true }); // httpOnly 옵션은 JavaScript로 쿠키에 접근할 수 없도록 설정
        res.json({ success: true, message: '로그인이 완료되었습니다.' });
        
      } else {
        res.json({ success: false, message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
      }

    });
  });


  // 로그인 라우트에 Passport를 사용하여 로그인 인증 처리
  app.post('/login', passport.authenticate('local', {
    successRedirect: '/home', // 로그인 성공 시 이동할 경로
    failureRedirect: '/login',     // 로그인 실패 시 이동할 경로
    failureFlash: true             // 인증 실패 시 플래시 메시지 사용 여부
  }));

  // 예매하기 버튼으로 login 눌렀을 경우 성공시 /seats로 리다이렉션
  app.post('/events-login', (req, res) => {
    const { userId, password } = req.body;

    // 데이터베이스에서 사용자 정보 확인 및 로그인 처리
    const query = 'SELECT * FROM users WHERE userId = ? AND password = ?';

    connection.query(query, [userId, password], (err, results) => {
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

        };
        //JWT 토큰 발급
        const accessToken = jwt.sign(req.session.user, 'test_key'); // 토큰에 담길 정보와 비밀 키 전달
        // 발급한 토큰을 쿠키에 저장
        res.cookie('access_token', accessToken, { httpOnly: true }); // httpOnly 옵션은 JavaScript로 쿠키에 접근할 수 없도록 설정
        res.json({ success: true, message: '로그인이 완료되었습니다.' });
        
      } else {
        res.json({ success: false, message: '사용자명 또는 비밀번호가 올바르지 않습니다.' });
      }

    });
  });

  app.post('/events-login', passport.authenticate('local', {
    successRedirect: '/seats', // 로그인 성공 시 이동할 경로
    failureRedirect: '/login',     // 로그인 실패 시 이동할 경로
    failureFlash: true             // 인증 실패 시 플래시 메시지 사용 여부
  }));



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
        // res.status(200).send('회원가입 완료!');
        res.redirect('/login');
        });
        
    
  });


  // 이벤트 디테일
  app.get('/events', (req, res) => {
    // res.render('events-1', { pageTitle: 'Details', user: req.session.user  });
  
    const pageTitle = "Details";
    // 렌더링 시 pageTitle 변수를 전달
    const user = req.session.user;
    res.render('events-1', { pageTitle, user: user });
  });

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



  app.post('/pop-seat', async (req, res) => {
    try {
      const id = req.session.id;
      const selectedSeat = req.body.seat; // 클라이언트에서 선택한 좌석
      const sector = selectedSeat.split('-')[0]; // 좌석에서 섹터 부분 추출
      const response = await axios.get(`http://localhost:5000/get-seat-data/${sector}/${id}`);
      
      if (response.status === 200) {    
        const seat_id = response.data.seat_id;
        console.log('Data from Flask Server:', seat_id);
        // 여기서 좌석 데이터를 사용하여 다른 작업을 수행할 수 있습니다.
        res.status(200).json({ seat_id });
      } else {
        console.error('Failed to get seat data from Flask Server.');
        res.status(500).send('Failed to get seat data from Flask Server.');
      }
    } catch (error) {
      console.error('Error sending get-seat-data request to Flask Server:', error);
      res.status(500).send('Error sending get-seat-data request to Flask Server.');
    }
  });

  app.get('/get-seat-data/:seat/:id', async (req, res) => {
    try {
      const seat = req.params.seat;
      const id = req.params.id;
      const response = await axios.get(`http://localhost:5000/get-seat-data/${seat}/${id}`);
      const seat_id= response.data.seat_id;
      res.status(200).json({ seat_id });
    } catch (error) {
      console.error('Error fetching seat data:', error);
      res.status(500).send('Error fetching seat data.');
    }
  });
  // app.post('/show-booking-info',async(req, res)=>{
  //   try {
  //     const id = req.session.id;
  //     const response = await axios.get(`http://localhost:5000/get-booking-info/${id}`);
      
  //     if (response.status === 200) {    
  //       const seat_id = response.data.seat_id;
  //       res.status(200).json({ seat_id });
  //     } else {
  //       console.error('Failed to get seat data from Flask Server.');
  //       res.status(500).send('Failed to get seat data from Flask Server.');
  //     }
  //   } catch (error) {
  //     console.error('Error sending get-seat-data request to Flask Server:', error);
  //     res.status(500).send('Error sending get-seat-data request to Flask Server.');
  //   }

  // })


  // 프로필-예매조회
  app.get('/get-booking-info/:id', async (req, res) =>{
    try{
      const id = req.params.id;
      const dynamoDBresponse = await axios.get(`http://localhost:5000/get-booking-info/${id}`);
      const seat_id = dynamoDBresponse.data.seat_id;
      res.status(200).json({ seat_id });

    }catch (error) {
      // 에러가 발생하면 클라이언트에게 에러 메시지를 응답
      res.status(500).json({ error: error.message });

  }

  });
  






  app.get('/bookTicket', (req, res) => {
    const user = req.session.user;
    if (user){
      res.redirect('/seats');

    }else {
      res.redirect('/login');
      
    }
  });

  app.get('/profile', (req, res) => {
    // 현재 세션에 저장된 사용자 정보 확인
    const user = req.session.user;

    if (user) {
        // 사용자 정보가 세션에 저장되어 있으면 프로필 페이지 렌더링
        res.render('profile', { user });
    } else {
        // 세션에 사용자 정보가 없으면 로그인 페이지로 리디렉션
        res.redirect('/login');
    }
  });
  app.get('/booking-success', (req, res) => {
    const user = req.session.user;
    res.render('booking-success',{user}); // booking-success.ejs 파일을 렌더링하여 클라이언트에게 전송
    
  });

 



  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log("백엔드 API 서버가 켜졌어요!!!");
  });
