import { Kafka } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import useragent from "useragent";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { pool } from "../utils/db";
import { logger } from "../utils/logger";

const kafka = new Kafka({
  clientId: "analytics-consumer",
  brokers: (process.env.KAFKA_BROKERS || "kafka:9092").split(","),
  retry: {
    retries: 10,
    initialRetryTime: 3000,
  },
});

const consumer = kafka.consumer({
  groupId: "analytics-workers",
});


interface ClickEvent {
  shortCode: string;
  urlId?: string;
  ip?: string;
  userAgent?: string;
  referer?: string;
  timestamp: string;
}


async function upsertUrlId(shortCode: string): Promise<string | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `
    SELECT id 
    FROM urls 
    WHERE short_code = ?
    `,
    [shortCode]
  );

  return rows.length > 0 ? rows[0].id : null;
}


async function processClick(event: ClickEvent) {

  // Parse browser/device information
  const agent = useragent.parse(event.userAgent || "");

  const browser = agent.family || "Unknown";
  const os = agent.os.family || "Unknown";

  const device =
    agent.device.family === "Other"
      ? "desktop"
      : "mobile";


  // Get URL ID
  const urlId =
    event.urlId ||
    (await upsertUrlId(event.shortCode));


  if (!urlId) {
    logger.warn(
      `Unknown URL for shortCode: ${event.shortCode}`
    );
    return;
  }


  // Convert ISO timestamp:
  // 2026-07-15T11:04:21.047Z
  //
  // Into MySQL DATETIME:
  // 2026-07-15 11:04:21

  const clickedAt = new Date(event.timestamp)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");



  await pool.execute<ResultSetHeader>(
    `
    INSERT INTO clicks
    (
      id,
      url_id,
      ip_address,
      browser,
      os,
      device,
      referer,
      clicked_at
    )
    VALUES (?, ?, INET6_ATON(?), ?, ?, ?, ?, ?)
    `,
    [
      uuidv4(),
      urlId,
      event.ip || null,
      browser,
      os,
      device,
      event.referer || null,
      clickedAt,
    ]
  );


  logger.info(
    `Recorded click for ${event.shortCode}`
  );
}



export async function startConsumer() {

  await consumer.connect();


  await consumer.subscribe({
    topic: "url.clicks",
    fromBeginning: false,
  });


  logger.info(
    "Kafka consumer subscribed to url.clicks"
  );


  await consumer.run({

    eachMessage: async ({ message }) => {

      if (!message.value) {
        return;
      }


      try {

        const event: ClickEvent =
          JSON.parse(
            message.value.toString()
          );


        await processClick(event);


      } catch (err) {

        logger.error(
          "Error processing click event",
          err
        );

      }

    },

  });

}