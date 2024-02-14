import boto3

aws_config = {
    "region": "ap-northeast-2'",
    "endpoint": ""
}

def get_dynamodb_resource(region_name='ap-northeast-2'):
    return boto3.resource('dynamodb', region_name=region_name)
# dynamodb = boto3.resource('dynamodb')
