// const redis = require('redis');
// const redisClient = redis.createClient(
//     {
//         socket: {
//             port: 6379,
//             host: '52.78.200.173'
//           },
//           password: 'masterdb'

//     }
// );
// // Redis 클라이언트 연결 확인
// redisClient.on('connect', () => {
//     console.log('Connected to Redis server');
// });

// // Redis 클라이언트 연결 종료
// redisClient.on('end', () => {
//     console.log('Redis client disconnected');
// });


// function popSeat(callback) {
//     if (redisClient.connected) {
//         // Redis에서 좌석 팝
//         redisClient.lPop('A-sector', (err, result) => {
//             if (err) {
//                 console.error('Error popping seat from Redis:', err);
//                 callback(err, null);
//             } else {
//                 console.log(`Popped seat ${result} from Redis.`);
//                 callback(null, result);
//             }
//         });
//     } else {
//         // 이미 닫혔으므로 에러를 콜백으로 전달
//         const error = new Error('Redis client is already closed');
//         console.error(error.message);
//         callback(error, null);
//     }

// }

// // 프로세스 종료 시 Redis 클라이언트 연결 종료
// process.on('exit', () => {
//     redisClient.quit();
// });
const redis = require('redis');
const express = require('express');

let redisClient;

function initializeRedisClient() {
    
    if (!redisClient || (redisClient && redisClient.status === 'end')) {
        redisClient = createRedisClient();
        // console.log('Redis client created');
        // Redis 클라이언트 연결 확인
        redisClient.on('connect', () => {
            console.log('Connected to Redis server');
        });

        // Redis 클라이언트 연결 종료
        redisClient.on('end', () => {
            console.log('Redis client disconnected');
        });

        // 에러 핸들링
        redisClient.on('error', (err) => {
            console.error('Redis client error:', err);
        });
        
    }else {
        console.log('Redis client already exists and is not in "end" state');
    }
}

function createRedisClient() {
    return redis.createClient({
        socket: {
            port: 6379,
            host: '127.0.0.1'
        },
        password: 'test123'
    });
}

async function popSeat() {
    try {
        initializeRedisClient(); // Redis 클라이언트 초기화
        while (!(redisClient && redisClient.status === 'ready')) {
            // 클라이언트가 준비될 때까지 대기
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
        }

        // Redis에서 좌석 팝
        return new Promise((resolve, reject) => {
            redisClient.lPop('A-sector', (err, result) => {
                if (err) {
                    console.error('Error popping seat from Redis:', err);
                    reject(err);
                } else {
                    console.log(`Popped seat ${result} from Redis.`);
                    resolve(result);
                }
            });
        });
    } catch (error) {
        console.error('Error in popSeat function:', error);
        throw error;
    }
}

// 프로세스 종료 시 Redis 클라이언트 연결 종료
process.on('exit', () => {
    if (redisClient) {
        redisClient.quit();
    }
});

module.exports = { popSeat };





  