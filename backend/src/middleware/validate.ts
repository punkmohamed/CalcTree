import { Request, Response, NextFunction, RequestHandler } from "express";
import { ZodSchema, ZodError } from "zod";

type SchemaMap = Partial<{
  body: ZodSchema<any>;
  query: ZodSchema<any>;
  params: ZodSchema<any>;
}>;
// Extend Request interface to include validated data
interface ValidatedRequest extends Request {
  validated?: {
    body?: any;
    query?: any;
    params?: any;
  };
}
export const validate = (schemas: SchemaMap): RequestHandler => {
  return (req:ValidatedRequest, res, next) => {
    try {
      req.validated = {};
      (["body", "query", "params"] as const).forEach((key) => {
        const schema = schemas[key];
        if (schema) {
          console.log(`Validating ${key}:`, req[key]); // Log input
          const result = schema.parse(req[key]);
          // Only assign if validation passes
          console.log(`Parsed ${key}:`, result); // Log parsed result
          req.validated![key] = result;
        }
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        console.log("Zod validation error:", error.issues); // Log validation issues
        res.status(400).json({
          error: "Validation error",
          details: error.issues,
          validationErrors: error.issues.map((e) => e.message),
        });
        return;
      }
      console.error("Unexpected error in validate middleware:", error); // Log unexpected error
      // Unexpected error
      res.status(500).json({
        error: "Internal server error",
      });
      return;
    }
  };
};
