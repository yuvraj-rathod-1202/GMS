import pika, sys, os
from dotenv import load_dotenv
from models.schema.queue import AssessmentQueueMessage
from services.queue import update_analytics_in_db

def main():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host="rabbitmq")
    )
    
    channel = connection.channel()
    
    def callback(ch, method, properties, body: AssessmentQueueMessage):
        try:
            update_analytics_in_db(body)
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)
    
    channel.basic_consume(
        queue=os.getenv("ANALYTICS_QUEUE"), on_message_callback=callback
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