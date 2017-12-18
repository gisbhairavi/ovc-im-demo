#!/bin/sh

VERSION=$1
BRANCH=$2

if [ "$BRANCH" ]
then
	VERSION=${VERSION}_${BRANCH}
fi

EB_BUCKET=ovc-im
SOURCE_BUNDLE="${VERSION}.zip"
S3_KEY="IM/${SOURCE_BUNDLE}"

cd beanstalk/
sed -i -e "s/:TAGNAME/:$VERSION/" Dockerrun.aws.json
zip -r "$SOURCE_BUNDLE"  Dockerrun.aws.json .ebextensions/
sed -i -e "s/:$VERSION/:TAGNAME/" Dockerrun.aws.json
cd-

export AWS_DEFAULT_REGION=us-east-1
# cp "$SOURCE_BUNDLE" "beanstalk/$SOURCE_BUNDLE"

aws s3 cp "$SOURCE_BUNDLE" s3://$EB_BUCKET/$S3_KEY
aws elasticbeanstalk create-application-version --application-name InventoryManager --version-label $VERSION --source-bundle S3Bucket=$EB_BUCKET,S3Key=$S3_KEY
