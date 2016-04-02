# Load Testing HTTP Servers

The Agent
---------
The load testing client (the agent) is run by the run-agent.js script like this:

    node run-agent.js --url http://ec2-52.amazonaws.com:8080 --frequency 30 --length 60

which will repeatedly call the `http://ec2-52.amazonaws.com:8080` endpoint at 30 requests per minute for 60 seconds.

Also, you can run `node run-agent.js --help`.

To get output in CSV format, run it like this:

    node run-agent.js --url http://ec2-52.amazonaws.com:8080 --frequency 30 --length 60 > ~/Desktop/load-test-data.csv

You'll see some output on your terminal, but that is stderr, not stdout.

### Environment Variables
#### Database Server
* __PORT__ HTTP port
* __MIN__ int - The min latency for database requests in milliseconds
* __MAX__ int - The max latency for database requests in milliseconds
* __OUTLIER__ int - The odds of having an outlier; a really long request

#### Applicaction Servers
* __PORT__ HTTP port
* __DATABASE_URL__ string - The URL for the database server
* __DATA_FILEPATH__ string - The path to the data file to serve

Copyright and License
---------------------
Copyright: (c) 2015 by Odd Networks Inc. (http://oddnetworks.co)

Unless otherwise indicated, all source code is licensed under the MIT license. See MIT-LICENSE for details.
