import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

import { pool } from "../utils/db";
import { redis } from "../utils/redis";
import { publishClickEvent } from "../utils/kafka";

import {
  redirectLatency,
  cacheHits,
  cacheMisses
} from "../utils/metrics";

import { logger } from "../utils/logger";


export const redirectRouter = Router();


const CACHE_TTL = 86400; // 24 hours


interface CachedUrl {
  original: string;
  expires: string | null;
  passwordHash: string | null;
}


function cacheKey(code: string) {
  return `url:${code}`;
}



// GET /:shortCode
redirectRouter.get("/:shortCode", async (
  req: Request,
  res: Response,
  next: NextFunction
) => {

  const end = redirectLatency.startTimer();

  const { shortCode } = req.params;


  // Reserved paths
  if (
    shortCode.startsWith("api") ||
    shortCode === "healthz" ||
    shortCode === "metrics"
  ) {
    end();

    res.status(404).json({
      error: "Not found"
    });

    return;
  }


  try {

    let urlData: CachedUrl | null = null;
    let urlId: string | null = null;



    // 1. Redis cache lookup

    const cached = await redis.get(
      cacheKey(shortCode)
    );


    if (cached) {

      cacheHits.inc();

      urlData = JSON.parse(cached);


    } else {


      cacheMisses.inc();



      // 2. Database lookup

      const [rows] = await pool.execute<RowDataPacket[]>(
        `
        SELECT 
          id,
          original_url,
          expires_at,
          password_hash
        FROM urls
        WHERE short_code = ?
        AND is_active = TRUE
        `,
        [shortCode]
      );



      if (!rows[0]) {

        end();

        res.status(404).json({
          error: "Short URL not found"
        });

        return;
      }



      const row = rows[0];


      urlId = row.id;



      urlData = {

        original: row.original_url,

        expires: row.expires_at,

        passwordHash: row.password_hash

      };



      // Cache warming

      await redis.setex(
        cacheKey(shortCode),
        CACHE_TTL,
        JSON.stringify(urlData)
      );

    }



    // IMPORTANT:
    // TypeScript null safety check

    if (!urlData) {

      end();

      res.status(404).json({
        error: "URL data missing"
      });

      return;
    }



    // 3. Expiry check

    if (
      urlData.expires &&
      new Date(urlData.expires) < new Date()
    ) {

      end();

      res.status(410).json({
        error: "This link has expired"
      });

      return;
    }





    // 4. Password protected URL

    if (urlData.passwordHash) {


      const submitted =
        req.headers["x-link-password"] as string | undefined;



      if (
        !submitted ||
        !(await bcrypt.compare(
          submitted,
          urlData.passwordHash
        ))
      ) {

        end();

        res.status(401).json({

          error:
          "This link is password protected. Provide X-Link-Password header."

        });

        return;

      }

    }





    // 5. Kafka analytics event

    publishClickEvent({

      shortCode,

      urlId,

      ip:
      req.headers["x-forwarded-for"] ||
      req.socket.remoteAddress,

      userAgent:
      req.headers["user-agent"],

      referer:
      req.headers.referer,

      timestamp:
      new Date().toISOString()

    })
    .catch(err =>
      logger.warn(
        "Click event publish failed",
        err
      )
    );





    // 6. Update click count async

    pool.execute<ResultSetHeader>(

      `
      UPDATE urls
      SET click_count = click_count + 1
      WHERE short_code = ?
      `,

      [shortCode]

    )
    .catch(err =>
      logger.warn(
        "Click count update failed",
        err
      )
    );





    // 7. Redirect

    end();

    res.redirect(
      302,
      urlData.original
    );


  } catch(err) {

    end();

    next(err);

  }

});