import pika, sys, os, asyncio, json
from dotenv import load_dotenv
from models.schema.compute import ComputeQueueMessage
from services.compute import update_total_in_db

def main():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host="rabbitmq")
    )
    
    channel = connection.channel()
    
    def callback(ch, method, properties, body: bytes):
        try:
            message_dict = json.loads(body.decode())
            message = ComputeQueueMessage(**message_dict)
            asyncio.run(update_total_in_db(message))
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print(f"Error processing message: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    
    channel.basic_consume(
        queue=os.getenv("COMPUTE_QUEUE"), on_message_callback=callback
    )
    
    print(" [*] Waiting for messages. To exit press CTRL+C")
    
    channel.start_consuming()
    
if __name__ == "__main__":
    load_dotenv()
    try:
        main()
    except KeyboardInterrupt:
        print("Interrupted")
        try:
            sys.exit(0)
        except SystemExit:
            os._exit(0)