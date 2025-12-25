FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends --no-install-suggests \
        build-essential \
        pkg-config \
        default-libmysqlclient-dev \
        && pip install --no-cache-dir --upgrade pip

WORKDIR /app

COPY ./requirements.txt /app
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8080"]