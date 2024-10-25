#!/bin/bash

# Abort immediately if a command fails
set -e

if [[ $# != 2 ]] ; then
    echo 'Missing required arguments: 1) CSV input path; 2) term slug'
    exit 0
fi

if [ $(command -v /opt/elasticbeanstalk/bin/get-config) ]; then
  PYTHONPATH=$(/opt/elasticbeanstalk/bin/get-config environment -k PYTHONPATH)
  RIPLEY_ENV=$(/opt/elasticbeanstalk/bin/get-config environment -k RIPLEY_ENV)
  app_dir="/var/app/current"
else
  PYTHONPATH=$(which python | sed "s/\/python//")
  RIPLEY_ENV=development
  app_dir="."
fi

cd $app_dir

export RIPLEY_ENV=${RIPLEY_ENV}
export RIPLEY_LOCAL_CONFIGS="$PWD/config"


echo
echo "------------------------------------------"
echo "Starting bCourses site provisioning from CSV..."
"${PYTHONPATH}/python" "${app_dir}/scripts/provision_sites_from_csv.py" $1 $2
