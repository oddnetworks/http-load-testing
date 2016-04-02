#!/bin/bash
address="$1"

rsync_opts="\
--recursive \
--compress \
--perms \
--times \
--omit-dir-times \
--progress \
--human-readable \
--exclude=.git/*** \
--exclude=node_modules/*** \
"

rsync $rsync_opts "$( pwd )/" "ubuntu@$address:/home/ubuntu/load-test-apps/"

echo "Deployed to $address"
