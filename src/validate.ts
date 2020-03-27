import { HttpError } from "./http-error";

export default function validate(body: any, validators: string[]) {
  for (const validator of validators) {
    if (typeof validator === 'string') {
      const [field, type] = validator.split(':');
      if (!validateType(body[field], type)) {
        throw new HttpError(422, `Invalid value for field ${field}.`);
      }
    }
  }
  return true;
}

function validateType(value: any, type: string): boolean {
  const required = type.endsWith('!');
  if (required) {
    type = type.substring(0, type.length - 1);
    if (type === 'string') {
      if (typeof value == 'string') {
        return value !== '';
      } else return false;
    } else return typeof value === type;
  }
  else {
    if (type === 'number' && typeof value === 'string') {
      if (!isNaN(parseFloat(value))) return true;
    }
    return typeof value === type || value === undefined || value === null;
  }
}
