export interface ITokenPayload {
    organizationId: string,
    userId: string,
    roles: string[],
    expiresAt: string
}