export declare class RepositoryError extends Error {
    readonly category: string;
    readonly previous: Error;
    readonly ["Error Category"]: string;
    readonly ["Error Title"]: string;
    readonly ["Error Message"]: string;
    constructor(category: string, title: string, previous: Error);
}
