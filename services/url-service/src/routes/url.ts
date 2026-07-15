import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { ResultSetHeader, RowDataPacket } from "mysql2/promise";

import { pool } from "../utils/db";
import { redis } from "../utils/redis";
import { generateShortCode, expiryToDate } from "../utils/shortCode";
import { authenticate, AuthRequest } from "../middleware/authenticate";


export const urlRouter = Router();

urlRouter.use(authenticate);


const createSchema = z.object({
  originalUrl: z.string().url(),
  customAlias: z.string().regex(/^[a-zA-Z0-9_-]{2,30}$/).optional(),
  expiry: z.enum(["7d", "30d", "365d", "never"]).optional(),
  password: z.string().max(72).optional(),
  title: z.string().max(500).optional(),
});


const updateSchema = z.object({
  originalUrl: z.string().url().optional(),
  title: z.string().max(500).optional(),
  expiry: z.enum(["7d", "30d", "365d", "never"]).optional(),
});


const CACHE_TTL = 86400;
const BASE_URL = process.env.BASE_URL || "http://localhost";


const cacheKey = (code:string)=>`url:${code}`;



// CREATE URL
urlRouter.post(
"/",
async(
req: Request,
res: Response,
next: NextFunction
)=>{

const authReq = req as AuthRequest;

try{


const body = createSchema.parse(req.body);


const id = uuidv4();


const shortCode =
body.customAlias || generateShortCode();


const expiresAt =
body.expiry && body.expiry !== "never"
?
expiryToDate(body.expiry)
:
null;


const passwordHash =
body.password
?
await bcrypt.hash(body.password,10)
:
null;



await pool.execute<ResultSetHeader>(
`
INSERT INTO urls
(
id,
user_id,
short_code,
original_url,
title,
expires_at,
password_hash
)
VALUES(?,?,?,?,?,?,?)
`,
[
id,
authReq.userId,
shortCode,
body.originalUrl,
body.title ?? null,
expiresAt,
passwordHash
]
);



const [rows] =
await pool.execute<RowDataPacket[]>(
`
SELECT
id,
short_code,
original_url,
title,
expires_at,
created_at
FROM urls
WHERE id=?
`,
[id]
);


const url = rows[0];


await redis.setex(
cacheKey(shortCode),
CACHE_TTL,
JSON.stringify({
original:url.original_url,
expires:url.expires_at
})
);



res.status(201).json({
...url,
shortUrl:`${BASE_URL}/${url.short_code}`
});


}
catch(err:any){

if(err.code==="ER_DUP_ENTRY"){
res.status(409).json({
error:"Alias already taken"
});
return;
}


if(err.name==="ZodError"){
res.status(400).json({
error:err.errors
});
return;
}


next(err);

}

});




// GET ALL URLS

urlRouter.get(
"/",
async(
req:Request,
res:Response,
next:NextFunction
)=>{


const authReq=req as AuthRequest;


try{


const page =
parseInt(
(req.query.page as string)||"1"
);


const limit =
Math.min(
parseInt(
(req.query.limit as string)||"20"
),
100
);


const offset=(page-1)*limit;



const [rows]=
await pool.execute<RowDataPacket[]>(
`
SELECT
id,
short_code,
original_url,
title,
expires_at,
click_count,
created_at
FROM urls
WHERE user_id=?
AND is_active=TRUE
ORDER BY created_at DESC
LIMIT ? OFFSET ?
`,
[
authReq.userId,
limit,
offset
]
);



res.json(
rows.map((r:any)=>({
...r,
shortUrl:`${BASE_URL}/${r.short_code}`
}))
);


}
catch(err){

next(err);

}

});





// GET SINGLE URL

urlRouter.get(
"/:shortCode",
async(
req:Request,
res:Response,
next:NextFunction
)=>{


const authReq=req as AuthRequest;


try{


const [rows]=
await pool.execute<RowDataPacket[]>(
`
SELECT *
FROM urls
WHERE short_code=?
AND user_id=?
AND is_active=TRUE
`,
[
req.params.shortCode,
authReq.userId
]
);



if(!rows[0]){

res.status(404).json({
error:"URL not found"
});

return;

}



res.json({
...rows[0],
shortUrl:
`${BASE_URL}/${rows[0].short_code}`
});


}
catch(err){

next(err);

}


});





// UPDATE URL

urlRouter.put(
"/:shortCode",
async(
req:Request,
res:Response,
next:NextFunction
)=>{


const authReq=req as AuthRequest;


try{


const body =
updateSchema.parse(req.body);



const expiresAt =
body.expiry &&
body.expiry!=="never"
?
expiryToDate(body.expiry)
:
null;



const [result]=
await pool.execute<ResultSetHeader>(
`
UPDATE urls SET

original_url=COALESCE(?,original_url),

title=COALESCE(?,title),

expires_at=COALESCE(?,expires_at)

WHERE short_code=?
AND user_id=?
`,
[
body.originalUrl ?? null,
body.title ?? null,
expiresAt,
req.params.shortCode,
authReq.userId
]
);



if(!result.affectedRows){

res.status(404).json({
error:"URL not found"
});

return;

}



await redis.del(
cacheKey(req.params.shortCode)
);



res.json({
message:"Updated successfully"
});


}
catch(err){

next(err);

}

});





// DELETE URL

urlRouter.delete(
"/:shortCode",
async(
req:Request,
res:Response,
next:NextFunction
)=>{


const authReq=req as AuthRequest;


try{


const [result]=
await pool.execute<ResultSetHeader>(
`
UPDATE urls
SET is_active=FALSE
WHERE short_code=?
AND user_id=?
`,
[
req.params.shortCode,
authReq.userId
]
);



if(!result.affectedRows){

res.status(404).json({
error:"URL not found"
});

return;

}



await redis.del(
cacheKey(req.params.shortCode)
);



res.status(204).send();


}
catch(err){

next(err);

}

});