export default function validate(body: any, validators: string[]) {
  for (const validator of validators) {
    if (typeof validator === 'string') {
      const [field, type] = validator.split(':');
      if (!validateType(body[field], type)) {
        return false;
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
    return typeof value === type;
  }
}
