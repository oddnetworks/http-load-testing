import os
import random
import urllib2
from time import sleep
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

PORT = int(os.getenv('PORT', 8080))
DATABASE_URL = os.getenv('DATABASE_URL')
DATA_FILEPATH = os.getenv('DATA_FILEPATH')

class Handler(BaseHTTPRequestHandler):

	def do_GET(self):
		urllib2.urlopen(DATABASE_URL)

		sleep(0.01)

		count = 0
		while count < 10000000:
			count = count + 1


		self.send_response(200)
		self.send_header('Content-type','text/plain')
		self.end_headers()
		self.wfile.write(open(DATA_FILEPATH).read())
		return

httpd = HTTPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()
