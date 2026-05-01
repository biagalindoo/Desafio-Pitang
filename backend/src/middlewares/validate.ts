import { NextFunction, Request, Response } from "express";
import { z } from "zod";

type RequestSchemas = {
  body?: z.ZodTypeAny;
  params?: z.ZodTypeAny;
  query?: z.ZodTypeAny;
};

export function validate(schemas: RequestSchemas) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (schemas.body) {
      request.body = schemas.body.parse(request.body);
    }

    if (schemas.params) {
      request.params = schemas.params.parse(request.params) as typeof request.params;
    }

    if (schemas.query) {
      request.query = schemas.query.parse(request.query) as typeof request.query;
    }

    return next();
  };
}
