FROM python:3
WORKDIR /usr/src/app
COPY . .
RUN pip3 install flask
RUN pip3 install flask-cors
RUN pip3 install redis
RUN pip3 install boto3
CMD ["python3", "redis_py.py"]