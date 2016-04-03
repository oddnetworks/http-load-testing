import os
import random
from time import sleep
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

PORT = int(os.getenv('PORT', 8888))

# Be default, the normal min latency will be 100ms.
MIN = int(os.getenv('MIN', 10))

# By default, the normal max latency will be 300ms.
MAX = int(os.getenv('MAX', 30))

class Handler(BaseHTTPRequestHandler):

	def do_GET(self):
		latency = random.randint(MIN, MAX)
		print 'latency -', latency
		sleep(latency / 1000.0)
		self.send_response(200)
		self.send_header('Content-type','application/json')
		self.end_headers()
		self.wfile.write("{}")
		return

httpd = HTTPServer(("", PORT), Handler)

print "serving at port", PORT
print "MIN", MIN
print "MAX", MAX
httpd.serve_forever()
