from flask import Flask, jsonify, request
import redis
from flask_cors import CORS
from awsConfig import get_dynamodb_resource

app= Flask(__name__)
CORS(app, supports_credentials=True)  


redis_host = "init-redis-cluster.tfsu7r.ng.0001.apn2.cache.amazonaws.com"
redis_port = 6379

# elasticache_endpoint = 'init-test-ro.tfsu7r.ng.0001.apn2.cache.amazonaws.com'
# elasticache_port = 6379

dynamodb = get_dynamodb_resource()

table = dynamodb.Table('init-dynamodb')
@app.route('/')
def hello_fnc():
    
    # r = redis.Redis(host=redis_host, port=redis_port)
    # data_bytes = r.lrange("A-sector", 0, -1)
    # data = [item.decode('utf-8') for item in data_bytes]
    # return jsonify({"list_data": data})

    # id = request.args.get('id')
    try:
        # DynamoDB에서 데이터 조회
        response = table.get_item(
            Key={
                # 'users.id': int(id)
                'users.id': 315
            }
        )

        # 조회된 데이터가 있는 경우
        if 'Item' in response:
            seat_id = response['Item'].get('seat_id')
            print(response)
            return jsonify({"seat_id": seat_id}), 200
            
        else:
            return jsonify({"error": "Booking info not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500






@app.route('/get-seat-data/<sector>/<id>', methods=['GET'])
def get_seat_data(sector,id):
    try:
        # Redis 클라이언트 생성
        # r = redis.Redis(host=client.host, port=client.port)
        r = redis.Redis(host=redis_host, port=redis_port)
        
        resp = table.get_item(
            Key={
                'users.id': int(id)
            }
        )

        if 'Item' in resp:
            return jsonify({"seat_id": -1})

        # 데이터 가져오기
        value = r.lpop(f"{sector}-sector")
        print("Value from Redis:", value)
        if value:
            # Redis에서 가져온 데이터
            seat_id = value.decode("utf-8")


            # DynamoDB에 데이터 입력
            putitem = {
                'users.id': int(id),
                'seat_id': seat_id
            }

            print(putitem)

            table.put_item(
                Item=putitem
            )

            return jsonify({"seat_id": seat_id})
        else:
            # return jsonify({"error": "예매 실패(매진)"}), 404   # 데이터가 null인경우
            return jsonify({"seat_id": None})  # 데이터가 없는 경우
    
    except Exception as e:
        return jsonify({"error": str(e)})
    
@app.route('/get-booking-info/<id>', methods=['GET'])
def get_booking_info(id):
    try:
        # DynamoDB에서 데이터 조회
        response = table.get_item(
            Key={
                'users.id': int(id)
            }
        )

        # 조회된 데이터가 있는 경우
        if 'Item' in response:
            seat_id = response['Item'].get('seat_id')
            print(response)
            return jsonify({"seat_id": seat_id}), 200
            
        else:
            return jsonify({"error": "Booking info not found"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
