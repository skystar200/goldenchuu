from flask import Flask, jsonify
import redis

from flask_cors import CORS

app= Flask(__name__)
CORS(app)  

redis_host = "localhost"
redis_port = 6379
redis_password = "test123"


@app.route('/get-seat-data/<sector>', methods=['GET'])
def get_seat_data(sector):
    try:
        # Redis 클라이언트 생성
        r = redis.Redis(host=redis_host, port=redis_port, password=redis_password)

        # 데이터 가져오기
        value = r.lpop(f"{sector}-sector")
        
        if value:
            return jsonify({"data": value.decode("utf-8")})  # byte string을 문자열로 디코딩하여 반환
        else:
            return jsonify({"data": None})  # 데이터가 없는 경우
    
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)