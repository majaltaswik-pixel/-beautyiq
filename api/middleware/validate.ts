import { Request, Response, NextFunction } from 'express';

export interface ValidationRule {
  field: string;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message?: string;
}

export function validateMiddleware(requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const field of requiredFields) {
      const value = getNestedValue(req.body, field);
      if (value === undefined || value === null || value === '') {
        errors.push(`Missing required field: ${field}`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        status: 400,
        details: errors,
      });
      return;
    }

    next();
  };
}

export function validateSchema(rules: ValidationRule[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      const value = getNestedValue(req.body, rule.field);

      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(rule.message || `Missing required field: ${rule.field}`);
        continue;
      }

      if (value === undefined || value === null) continue;

      if (rule.type && typeof value !== rule.type) {
        if (rule.type === 'array' && !Array.isArray(value)) {
          errors.push(rule.message || `Field ${rule.field} must be an array`);
        } else if (rule.type !== 'array') {
          errors.push(rule.message || `Field ${rule.field} must be of type ${rule.type}`);
        }
        continue;
      }

      if (rule.minLength !== undefined && typeof value === 'string' && value.length < rule.minLength) {
        errors.push(rule.message || `Field ${rule.field} must be at least ${rule.minLength} characters`);
      }

      if (rule.maxLength !== undefined && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(rule.message || `Field ${rule.field} must be at most ${rule.maxLength} characters`);
      }

      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(rule.message || `Field ${rule.field} has invalid format`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: 'Validation failed',
        status: 400,
        details: errors,
      });
      return;
    }

    next();
  };
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

export function sanitizeBody(allowedFields: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const sanitized: Record<string, any> = {};
    for (const field of allowedFields) {
      const value = getNestedValue(req.body, field);
      if (value !== undefined) {
        setNestedValue(sanitized, field, value);
      }
    }
    req.body = sanitized;
    next();
  };
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}
