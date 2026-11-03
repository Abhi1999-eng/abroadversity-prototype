"""Serve the prototype on http://localhost:5500 without browser caching,
so every edit shows on a normal reload."""
import functools
import http.server
import os

PORT = 5500
ROOT = os.path.dirname(os.path.abspath(__file__))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    handler = functools.partial(NoCacheHandler, directory=ROOT)
    with http.server.ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"Prototype on http://localhost:{PORT}")
        httpd.serve_forever()
