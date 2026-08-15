import "dotenv/config";
import app from "./app.js";

const port = process.env.PORT || 3000;

if (process.env.VERCEL !== "1") {
  app.listen(port, () => console.log(`Market-IA listo en http://localhost:${port}`));
}

export default app;
