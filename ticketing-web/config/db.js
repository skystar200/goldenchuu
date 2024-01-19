// db.js
// @ts-nocheck
// const mysql = require('mysql');
import mysql from 'mysql';
const dbInfo = {
    host: '',
    user: '',
    password: '',
    database: '',
};

// connection 변수 선언 및 초기화
const connection = mysql.createConnection(dbInfo);

//연결
connection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL: ' + err.stack);
      return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
  });
//모듈로 내보내기
// module.exports= connection ;
export default connection;
// ->es 모듈 스타일로 변경한 것

// module.exports = {
//     init: function() {
//         return mysql.createConnection(dbInfo);

//     },
//     connect: function(conn) {
//         conn.connect(function(err){
//             if(err) console.error('mysql 연결 에러 : ' + err);
//             else console.log('mysql 연결 성공 ');
//         });

//     }
// };
