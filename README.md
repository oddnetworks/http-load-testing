# Load Testing HTTP Servers

Objective
---------
Make some observations about how blocking and non-blocking application servers behave when connected to a database server under various rates of load.

This is __not__ to benchmark how many requests per minute a particular server can handle.

This is __not__ to demonstrate any technology or framework as better than another.

### Methodology
Fire requests at both blocking (Python) and non-blocking (Node.js) application servers at various rates of requests per minute to see how each of the servers behaves.

Also, stand up a fake database server which the application servers will call once for each request.

Make requests against each of the servers at various rates using a request agent from a local laptop.

The Agent
---------
The load testing client (the agent) is run by the run-agent.js script like this:

    node run-agent.js \
      --url http://ec2-52.amazonaws.com:8080 \
      --timeout 20 \
      --frequency 30 \
      --length 60

which will repeatedly call the `http://ec2-52.amazonaws.com:8080` endpoint at 30 requests per minute for 60 seconds.

Also, you can run `node run-agent.js --help`.

To get output in CSV format, run it like this:

    node run-agent.js \
      --url http://ec2-52.amazonaws.com:8080 \
      --timeout 20 \
      --frequency 30 \
      --length 60 > ~/Desktop/load-test-data.csv

You'll see some output on your terminal, but that is stderr, not stdout.

The Servers
-----------
There are 4 servers:
* A plain vanilla Python server `vanilla-python-server.py`
* A plain vanilla Node.js server `vanilla-node-server.py`
* A Seneca.js Node.js server `seneca-node-server.py`
* A fake database server `database-server.py`

All application servers perform the following tasks:
* Accept a GET request
* Make a single request to the database and wait for a response
* Read a file off disk and return it to the client

The Node.js servers also throw random errors during the database response to test how Seneca.js handles these vs. native Promises.

### Environment Variables
#### Database Server
* __PORT__ HTTP port
* __MIN__ int - The min latency for database requests in milliseconds
* __MAX__ int - The max latency for database requests in milliseconds

#### Applicaction Servers
* __PORT__ HTTP port
* __DATABASE_URL__ string - The URL for the database server
* __DATA_FILEPATH__ string - The path to the data file to serve

Copyright and License
---------------------
Copyright: (c) 2015 by Odd Networks Inc. (http://oddnetworks.co)

Unless otherwise indicated, all source code is licensed under the MIT license. See MIT-LICENSE for details.
