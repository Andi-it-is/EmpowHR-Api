require("reflect-metadata"); // Must remain require at the very top

// express
import express, { Request } from "express";
const app = express();

// helmet
import helmet from "helmet";
app.use(helmet());

// setup logger
import morgan from "morgan";

// Custom logging format.
const loggingFormat = ":date[iso] - :method - :url - :status - :response-time ms - :total-time ms - :res[content-length]";
app.use(morgan(loggingFormat, {
    skip: (req: Request) => {
        return req.method === 'OPTIONS' || process.env.NODE_ENV == "test";
    }
}));


// // body parser
// import bodyparser from "body-parser";
// app.use(bodyparser.json());

// TODO: cors
const cors = require('cors')
// app.use(function (req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
//     res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//     next();
// });
// app.use(cors());  


let corsOptions = {
    origin: process.env.CORS_ORIGIN,
    optionSuccessStatus: 200,
    methods: ['GET', 'PUT', 'PATCH', 'POST', 'DELETE']
}
app.use(cors(corsOptions))
app.use(express.json())

// routes
import versionRouter from "./api/versionRouter";
app.use(versionRouter);


import { AppDataSource } from "./AppDataSource";
const PORT: string = process.env.PORT || "3000";
app.listen(PORT, async () => {

    console.log('Timezone:', Intl.DateTimeFormat().resolvedOptions().timeZone);

    await connectToDb();
    console.log(`Backend started. Listening on port: ${PORT}`);
});

// swagger
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "EmpowHR API",
            version: "1.0.0",
            description: "API Dokumentation für EmpowHR",
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: "Development Server",
            },
        ],
    },
    apis: [__dirname + "/api/v1/**/*.{js,ts}"],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Use the DataSource to initialize connection and run the Migrations
const connectToDb = async (): Promise<any> => {

    for (let counter = 0; counter < 3; counter++) {

        try {
            await AppDataSource.initialize();
            break;
        } catch (error) {

            if (counter == 2) {
                throw error;
            }
            console.log("could not connect to db - retry in 3 sec (" + (counter + 1) + "/3)");
            await delay(3);
        }

    }

    const env = process.env.NODE_ENV === "production" ? "MySQL (Production)" : "PostgreSQL (Development)";
    console.log(`Connection to DB successful - using ${env}`);
    console.log("Running migrations...");

    await AppDataSource.runMigrations();

    console.log(`Migrations successful | ${env} | Backend ready`);

    return;
};

const delay = (n: any) => new Promise(r => setTimeout(r, n * 1000));
