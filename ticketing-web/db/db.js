// db.js
// @ts-nocheck
const mysql = require('mysql');
const util = require('util');
//RDS 연동
const dbInfo = {
    host: 'init-rds.c3oaiws8kipy.ap-northeast-2.rds.amazonaws.com',
    user: 'admin',
    password: 'test1234',
    database: 'init_db',
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
const query = util.promisify(connection.query).bind(connection);
module.exports= connection ;
