import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { redirectRouter } from "./routes/redirect";
import { metricsRouter } from "./routes/metrics";
import { errorHandler } from "./middleware/errorHandler";

import { logger } from "./utils/logger";
import { initKafkaProducer } from "./utils/kafka";


const app = express();

const PORT = parseInt(
  process.env.PORT || "3006",
  10
);



app.use(express.json());



app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);



app.use(
  morgan("combined", {
    stream: {
      write: (msg) =>
        logger.info(msg.trim()),
    },
  })
);



// Prometheus metrics

app.use(
  "/metrics",
  metricsRouter
);




// Root service check

app.get("/", (_req, res) => {

  res.json({

    service: "redirect-service",

    status: "running",

    message: "URL redirect service is active"

  });

});




// Health check

app.get("/healthz", (_req, res) => {

  res.json({

    status: "ok",

    service: "redirect-service"

  });

});




// Redirect routes

app.use(
  "/",
  redirectRouter
);




// Error handler

app.use(errorHandler);






async function start() {

  try {


    await initKafkaProducer();



    app.listen(PORT, () => {

      logger.info(
        `Redirect service listening on port ${PORT}`
      );

    });



  } catch (err) {


    logger.error(
      "Failed to start redirect service",
      err
    );


    process.exit(1);

  }

}



start();