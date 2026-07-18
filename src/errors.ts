export class RepositoryError extends Error {
  public readonly category: string;
  public readonly previous: Error;
  public readonly ["Error Category"]: string;
  public readonly ["Error Title"]: string;
  public readonly ["Error Message"]: string;

  constructor(category: string, title: string, previous: Error) {
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
