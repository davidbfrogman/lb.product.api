export class HealthStatus{
    public static isDatabaseConnected: boolean = false;
    public static isApiErrorHandlerInitialized: boolean = false;
    public static isEnvironmentVariableSet: boolean = false;
    public static isLoggingInitialized: boolean = false;
    public static isSecured: boolean = false;
    public static isDatabaseSeeded: boolean = false;
    public static isSupportingServicesSeeded: boolean = false;

    public static isHealthy(): boolean{
        return  this.isDatabaseConnected &&
                this.isApiErrorHandlerInitialized &&
                this.isEnvironmentVariableSet &&
                this.isLoggingInitialized &&
                this.isDatabaseSeeded &&
                this.isSupportingServicesSeeded &&
                this.isSecured;
    }
}