import { AbstractControl, ValidatorFn } from '@angular/forms';

/**
 * Validates that the input value is a valid name, allowing only letters, spaces, and certain punctuation.
 * @param control The form control to validate.
 * @returns `null` if the input is valid, or an object with a `invalidName` property if the input is invalid.
 */
export function nameValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const nameRegex =
      /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ]+\s[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ]+$/;
    const valid = nameRegex.test(control.value);
    return valid ? null : { invalidName: true };
  };
}

/**
 * Validates that the input value is a valid email address.
 * @param control The form control to validate.
 * @returns `null` if the input is a valid email address, or an object with an `invalidEmail` property if the input is invalid.
 */
export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const valid = emailRegex.test(control.value);
    return valid ? null : { invalidEmail: true };
  };
}

/**
 * Validates that the input value is not just whitespace.
 * @param control The form control to validate.
 * @returns `null` if the input is not just whitespace, or an object with a `whitespace` property if the input is just whitespace.
 */
export function messageValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const isWhitespace = (control.value || '').trim().length === 0;
    return isWhitespace ? { whitespace: true } : null;
  };
}

/**
 * Validates that the input value is a valid password, requiring a minimum length of 8 characters.
 * @param control The form control to validate.
 * @returns `null` if the input is a valid password, or an object with an `invalidPassword` property if the input is invalid.
 */
export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const password = control.value.trim();
    const valid = password.length >= 8;
    return valid ? null : { invalidPassword: true };
  };
}
