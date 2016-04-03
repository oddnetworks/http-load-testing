import os
import random
import urllib2
import time
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

PORT = int(os.getenv('PORT', 8080))
DATABASE_URL = os.getenv('DATABASE_URL')
DATA_FILEPATH = os.getenv('DATA_FILEPATH')

class Handler(BaseHTTPRequestHandler):

	def do_GET(self):
		if DATABASE_URL:
			dbstart = time.time()
			urllib2.urlopen(DATABASE_URL)
			print 'db access time %.3f seconds' % (time.time() - dbstart)

		self.send_response(200)
		self.send_header('Content-type','text/plain')
		self.end_headers()
		self.wfile.write(open(DATA_FILEPATH).read())
		return

httpd = HTTPServer(("", PORT), Handler)

print "serving at port", PORT
httpd.serve_forever()
