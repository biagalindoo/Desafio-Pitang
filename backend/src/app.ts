import cors from "cors";
import express from "express";
import { routes } from "./routes";
import { errorHandler } from "./middlewares/error-handler";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(routes);
app.use(errorHandler);

