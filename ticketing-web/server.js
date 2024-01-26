const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const Server = http.createServer(app);
const io = socketIO(Server);
// 좌석 정보
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

// 뷰 엔진 설정-> 라우팅으로 동적 페이지를 렌더링하려면 express 뷰엔진 설정해야함(seats.ejs 불러오기위함)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/seats', (req, res) => {
  res.render('seats', { pageTitle: 'Seats' });
});
app.use(express.static(__dirname));




// let seats = initializeSeats();

// CORS 설정
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// 정적 파일 서빙
app.use('/public', express.static(path.join(__dirname, 'public')));
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

  // 예매 완료 이벤트 처리
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


// io.on('connection', (socket) => {
//   // 클라이언트가 연결되면 초기 좌석 정보를 전송
//   socket.emit('initialSeats', seats);

//   // 클라이언트가 좌석을 선택했을 때 처리
//   socket.on('selectSeat', (selectedSeat) => {
//     // 좌석 선택 로직 처리 (예: 좌석 상태 변경, 예약 등)
//     seats = updateSeatSelection(seats, selectedSeat); // 좌석 업데이트 함수 구현 필요

//     // 변경된 좌석 정보를 모든 클라이언트에게 전송
//     io.emit('updateSeats', seats);
//   });
// });


// // 좌석 초기화 함수
// function initializeSeats() {
//   const rows = 3;
//   const seatsPerRow = 5;
//   const initialSeats = [];

//   for (let i = 0; i < rows; i++) {
//     const row = Array(seatsPerRow).fill(0);
//     initialSeats.push(row);
//   }

//   return initialSeats;
// }

// // 좌석 업데이트 함수 (예시)
// function updateSeatSelection(seats, selectedSeat) {
//   const { row, column } = selectedSeat;

//   // 예시: 좌석이 비어있으면 1로 설정
//   if (seats[row] && seats[row][column] === 0) {
//     seats[row][column] = 1;
//   }

//   return seats;
// }

// ... 여기에 Express 앱의 라우팅 및 미들웨어 설정 ...

const PORT = process.env.PORT || 3001;
Server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// const startServer = (port) => {
//   server.listen(port, () => {
//     console.log(`Server is running on port ${port}`);
//   });
// };

// module.exports = { startServer };
