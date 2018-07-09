export const CONST = {
    ep: {
        API: '/api',
        V1: '/v1',
        AUTHENTICATE: '/authenticate',
        USERS: '/users',
        REGISTER: '/register',
        API_DOCS: '/api-docs',
        API_SWAGGER_DEF: '/swagger-definition',
        PERMISSIONS: '/permissions',
        ROLES: '/roles',
        UPGRADE: '/upgrade',
        ORGANIZATIONS: '/organizations',
        PRODUCT_TEMPLATES: '/product-templates',
        PRODUCTS: '/products',
        SUPPLIERS: '/suppliers',
        ORDERS: '/orders',
        NOTIFICATIONS: '/notifications',
        DELETE_IMAGE: '/delete-image',
        DELETE_IMAGE_GROUP: '/delete-image-group',
        CREATE_FROM_TEMPLATE: '/create-product-from-template',
        UPLOAD_IMAGES: '/upload-images',
        SEND: '/send',
        ACCEPT: '/accept',
        REJECT: '/reject',
        PICKUP: '/pickup',
        DELIVER: '/deliver',
        COMPLETE: '/complete',
        client: {
        },
        common:{
            QUERY: '/query'
        }
    },
    TOKEN_HEADER_KEY: "x-access-token",
    ADMIN_ROLE: 'admin',
    GUEST_ROLE: 'guest',
    PRODUCT_ADMIN_ROLE: 'product:admin',
    PRODUCT_EDITOR_ROLE: 'product:editor',
    SUPPLIER_EDITOR_ROLE: 'supplier:editor',
    SUPPLIER_ADMIN_ROLE: 'supplier:admin',
    MOMENT_DATE_FORMAT: 'YYYY-MM-DD h:mm:ss a Z',
    LEBLUM_API_Q_BACKPLANE: 'leblum-api-q-backplane',
    REQUEST_TOKEN_LOCATION: 'api-decoded-token',
    SALT_ROUNDS: 10,
    errorCodes: {
        EMAIL_TAKEN: 'EmailAlreadyTaken',
        PASSWORD_FAILED_CHECKS: 'PasswordFailedChecks',
        EMAIL_VERIFICATION_EXPIRED: 'EmailVerificationHasExpired',
        PASSWORD_RESET_TOKEN_EXPIRED: 'PasswordResetTokenExpired',
        SUPPLIER_NAME_TAKEN: 'SupplierNameTaken',
        SUPPLIER_SLUG_TAKEN: 'SupplierSlugTaken',
    },
    testing:{
        PRODUCT_ADMIN_EMAIL: "integration.product.adminRole@leblum.com",
        PRODUCT_EDITOR_EMAIL: "integration.product.editorRole@leblum.com",
        SUPPLIER_ADMIN_EMAIL: "integration.supplier.adminRole@leblum.com",
        SUPPLIER_EDITOR_EMAIL: "integration.supplier.editorRole@leblum.com",
        UPGRADE_USER_EMAIL: "integration.supplier.upgrade.editor@leblum.com",
        ORGANIZATION_NAME: "IntegrationTestOrganization",
        PUSH_TOKEN: 'fLJEsDMKn1M:APA91bE3Ins30n5DksYkZ7AS7m0x6oH9sSFUbP01Jrb7UyELrjo8obESU_IwJ9qHuxLYA5zxLqjszJwyw4MLojJUEUgEo7DROixo-NyXFtYPgkq_pgy-P1v5nkYiQYkn5SobZU7HPMCj',
    },
    IMAGE_UPLOAD_PATH: './img-uploads/',
}