import os
import random
from time import sleep
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

PORT = 8888

# Be default, the normal min latency will be 100ms.
MIN = os.getenv('MIN', 100)

# By default, the normal max latency will be 300ms.
MAX = os.getenv('MAX', 300)

# By default, 1 of every 20 requests will be an outlier.
OUTLIER = os.getenv('OUTLIER', 20)

class Handler(BaseHTTPRequestHandler):

	def do_GET(self):
		if random.randint(1, OUTLIER) is 1:
			latency = MAX * 10
		else:
			latency = random.randint(MIN, MAX)

		print 'latency - %s', latency
		sleep(latency / 1000.0)
		self.send_response(200)
		self.send_header('Content-type','application/json')
		self.end_headers()
		self.wfile.write("{}")
		return

httpd = HTTPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()
