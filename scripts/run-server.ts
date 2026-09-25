const mode = process.argv[2];

if (mode !== "development" && mode !== "production") {
  throw new Error("Usage: run-server.ts <development|production>");
}

process.env.NODE_ENV = mode;
await import("../server.ts");
