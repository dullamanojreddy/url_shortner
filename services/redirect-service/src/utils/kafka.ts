import { Kafka, Producer } from "kafkajs";
import { logger } from "./logger";

const kafka = new Kafka({
  clientId: "redirect-service",
  brokers: (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
});

let producer: Producer;

export async function initKafkaProducer() {
  producer = kafka.producer();
  await producer.connect();
  logger.info("Kafka producer connected");
}

export async function publishClickEvent(event: Record<string, unknown>) {
  if (!producer) return;
  try {
    await producer.send({
      topic: "url.clicks",
      messages: [{ value: JSON.stringify(event) }],
    });
  } catch (err) {
    logger.error("Failed to publish click event", err);
  }
}
