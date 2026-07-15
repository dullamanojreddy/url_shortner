import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RowDataPacket } from "mysql2/promise";
import { pool } from "../utils/db";

export const analyticsRouter = Router();


interface AuthRequest extends Request {
  userId?: string;
}


function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {

  const h = req.headers.authorization;


  if (!h?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Unauthorized"
    });
    return;
  }


  try {

    const payload = jwt.verify(
      h.slice(7),
      process.env.JWT_SECRET!
    ) as {
      userId: string;
    };


    req.userId = payload.userId;


    next();


  } catch {

    res.status(401).json({
      error: "Invalid token"
    });

  }
}



// GET /api/v1/analytics/:shortCode
// summary + breakdown

analyticsRouter.get(
  "/:shortCode",
  authenticate,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {


    try {


      if (!req.userId) {
        res.status(401).json({
          error: "Unauthorized"
        });
        return;
      }



      const { shortCode } = req.params;



      // Verify URL ownership

      const [urlRows] =
        await pool.execute<RowDataPacket[]>(
          `
          SELECT id 
          FROM urls 
          WHERE short_code = ?
          AND user_id = ?
          `,
          [
            shortCode,
            req.userId
          ]
        );



      if (!urlRows[0]) {

        res.status(404).json({
          error: "URL not found"
        });

        return;
      }



      const urlId = urlRows[0].id;




      const [
        [totalRows],
        [byBrowserRows],
        [byDeviceRows],
        [byOsRows],
        [recentRows]
      ] = await Promise.all([



        pool.execute<RowDataPacket[]>(
          `
          SELECT COUNT(*) AS count
          FROM clicks
          WHERE url_id = ?
          `,
          [
            urlId
          ]
        ),




        pool.execute<RowDataPacket[]>(
          `
          SELECT 
            browser,
            COUNT(*) AS count
          FROM clicks
          WHERE url_id = ?
          GROUP BY browser
          ORDER BY count DESC
          LIMIT 10
          `,
          [
            urlId
          ]
        ),




        pool.execute<RowDataPacket[]>(
          `
          SELECT 
            device,
            COUNT(*) AS count
          FROM clicks
          WHERE url_id = ?
          GROUP BY device
          ORDER BY count DESC
          `,
          [
            urlId
          ]
        ),





        pool.execute<RowDataPacket[]>(
          `
          SELECT 
            os,
            COUNT(*) AS count
          FROM clicks
          WHERE url_id = ?
          GROUP BY os
          ORDER BY count DESC
          LIMIT 10
          `,
          [
            urlId
          ]
        ),





        pool.execute<RowDataPacket[]>(
          `
          SELECT 
            DATE(clicked_at) AS day,
            COUNT(*) AS count
          FROM clicks
          WHERE url_id = ?
          AND clicked_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
          GROUP BY day
          ORDER BY day
          `,
          [
            urlId
          ]
        )

      ]);





      res.json({

        shortCode,

        totalClicks:
          Number(
            totalRows[0].count
          ),


        browsers:
          byBrowserRows,


        devices:
          byDeviceRows,


        operatingSystems:
          byOsRows,


        clicksLast30Days:
          recentRows

      });



    } catch(err) {

      next(err);

    }

  }
);







// GET /api/v1/analytics/:shortCode/clicks
// paginated raw clicks


analyticsRouter.get(
  "/:shortCode/clicks",
  authenticate,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {


    try {



      if (!req.userId) {

        res.status(401).json({
          error:"Unauthorized"
        });

        return;

      }





      const { shortCode } = req.params;



      const [urlRows] =
        await pool.execute<RowDataPacket[]>(
          `
          SELECT id
          FROM urls
          WHERE short_code = ?
          AND user_id = ?
          `,
          [
            shortCode,
            req.userId
          ]
        );




      if (!urlRows[0]) {

        res.status(404).json({
          error:"URL not found"
        });

        return;

      }




      const page =
        parseInt(
          (req.query.page as string) || "1",
          10
        );



      const limit =
        Math.min(
          parseInt(
            (req.query.limit as string) || "50",
            10
          ),
          200
        );



      const offset =
        (page - 1) * limit;




      const [rows] =
        await pool.execute<RowDataPacket[]>(
          `
          SELECT 
            id,
            browser,
            os,
            device,
            referer,
            clicked_at
          FROM clicks
          WHERE url_id = ?
          ORDER BY clicked_at DESC
          LIMIT ?
          OFFSET ?
          `,
          [
            urlRows[0].id,
            limit,
            offset
          ]
        );




      res.json({

        data: rows,

        page,

        limit

      });




    } catch(err) {

      next(err);

    }


  }
);