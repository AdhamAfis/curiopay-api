import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import * as zxcvbn from 'zxcvbn';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value !== 'string') return false;

          // Basic requirements
          const hasMinLength = value.length >= 8;
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

          // Check basic requirements first
          const meetsBasicRequirements =
            hasMinLength &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumbers &&
            hasSpecialChar;

          if (!meetsBasicRequirements) return false;

          // Then check zxcvbn score
          const result = zxcvbn(value);
          return result.score >= 2; // Reduced from 3 to 2
        },
        defaultMessage(args: ValidationArguments) {
          const value = args.value;

          // Check each requirement and build specific feedback
          const hasMinLength = value.length >= 8;
          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

          const missing: string[] = [];
          if (!hasMinLength) missing.push('at least 8 characters');
          if (!hasUpperCase) missing.push('an uppercase letter');
          if (!hasLowerCase) missing.push('a lowercase letter');
          if (!hasNumbers) missing.push('a number');
          if (!hasSpecialChar) missing.push('a special character');

          if (missing.length > 0) {
            return `Password must contain ${missing.join(', ')}`;
          }

          // If basic requirements are met but zxcvbn score is low
          const result = zxcvbn(value);
          if (result.score < 2) {
            return (
              result.feedback.warning ||
              'Password is too weak. Try making it longer or more complex.'
            );
          }

          return 'Password is too weak';
        },
      },
    });
  };
}
