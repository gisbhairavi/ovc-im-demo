#! /bin/bash

SHA1=$1
CIRCLE_BRANCH=$2

# Create new Elastic Beanstalk version
EB_BUCKET=elasticbeanstalk-us-east-1-748109554602
DOCKERRUN_FILE=beanstalk/Dockerrun.aws.json

VERSION=${SHA1}_${CIRCLE_BRANCH}
echo $VERSION
S3_KEY=$VERSION-Dockerrun.aws.json
export AWS_DEFAULT_REGION=us-east-1

#aws s3 cp $DOCKERRUN_FILE s3://$EB_BUCKET/$S3_KEY
#aws elasticbeanstalk create-application-version --application-name InvMgmt-Develop  --version-label $VERSION --source-bundle S3Bucket=$EB_BUCKET,S3Key=$S3_KEY

# Update Elastic Beanstalk environment to new version
aws elasticbeanstalk update-environment --environment-name ${CIRCLE_BRANCH}-im  --version-label ${CIRCLE_BRANCH}
