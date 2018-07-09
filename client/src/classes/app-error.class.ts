export class AppError extends Error {
    public name: string = 'AppError';
    public description: string;
    public statusCode: number;
    public statusText: string;
}

export class ComponentError extends AppError {
    public name: string = 'ComponentError';
}

export class EventBusError extends AppError {
    public name: string = 'EventBusError';
}

export class ServiceError extends AppError {
    public name: string = 'ServiceError';
}