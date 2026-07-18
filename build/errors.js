"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepositoryError = void 0;
class RepositoryError extends Error {
    constructor(category, title, previous) {
        super(title);
        this.name = this.constructor.name;
        this.category = category;
        this.previous = previous;
        this["Error Category"] = category;
        this["Error Title"] = title;
        this["Error Message"] =
            previous && previous.message ? previous.message : String(previous);
        Error.captureStackTrace(this, RepositoryError);
    }
}
exports.RepositoryError = RepositoryError;
