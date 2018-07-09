export interface IValidationError{
    message: string;
    field: string;
    path: string;
    value: string;
}