import { serveDir } from "jsr:@std/http@1.0.20/file-server";

// Static file server for Deno Deploy serving the prebuilt _site directory
Deno.serve((req) => {
  return serveDir(req, {
    fsRoot: "_site",
    quiet: true,
  });
});
