export interface MulterFile {
    path: string // Available using `DiskStorage`.
    mimetype: string
    originalname: string,
    encoding: string,
    destination: string,
    filename: string,
    size: number
}