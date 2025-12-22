import { ZodError } from 'zod';
import { graphDSLSchemaV0_2 } from './schema.js';
import type { GraphDSL, Result, ValidationError } from './types.js';

/**
 * Parse and validate a DSL JSON object.
 * Returns a Result - never throws.
 *
 * @example
 * const result = parseDSL(jsonData);
 * if (result.ok) {
 *   console.log(result.value.meta.name);
 * } else {
 *   console.error(result.error.message);
 * }
 */
export function parseDSL(input: unknown): Result<GraphDSL, ValidationError> {
  try {
    const parsed = graphDSLSchemaV0_2.parse(input);
    return { ok: true, value: parsed };
  } catch (err) {
    if (err instanceof ZodError) {
      const firstIssue = err.issues[0];
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: firstIssue.message,
          path: firstIssue.path.join('.'),
        },
      };
    }
    return {
      ok: false,
      error: {
        code: 'PARSE_ERROR',
        message: err instanceof Error ? err.message : 'Unknown error',
      },
    };
  }
}

/**
 * Validate a DSL JSON string.
 * Convenience wrapper around parseDSL that handles JSON parsing.
 */
export function validateDSL(jsonString: string): Result<GraphDSL, ValidationError> {
  try {
    const parsed = JSON.parse(jsonString);
    return parseDSL(parsed);
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'JSON_PARSE_ERROR',
        message: err instanceof Error ? err.message : 'Failed to parse JSON',
      },
    };
  }
}


