FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends --no-install-suggests \
        build-essential \
        pkg-config \
        default-libmysqlclient-dev \
        && pip install --no-cache-dir --upgrade pip

WORKDIR /app

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

RUN sed -i 's/\r$//' /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 7000

CMD ["/app/start.sh"]
