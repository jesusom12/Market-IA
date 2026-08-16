import app from "./app.js";

export function createVercelHandler(pathname) {
  return function vercelHandler(request, response) {
    const requestUrl = request.url || "";
    const queryIndex = requestUrl.indexOf("?");
    const query = queryIndex >= 0 ? requestUrl.slice(queryIndex) : "";
    request.url = `${pathname}${query}`;
    return app(request, response);
  };
}
