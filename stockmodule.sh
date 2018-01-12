## EC2 Box: Amazon Linux AMI

ssh ec2-user@sarinstall1.ovcdemo.com

# Update the environment
sudo yum -y update

# Install Tools: Development tools
sudo yum -y install gcc-c++ make openssl-devel git libtool

# Install Npm + Nodejs
sudo yum -y install nodejs npm --enablerepo=epel

# Install Npm dependencies
sudo npm install -g node-gyp
sudo npm install -g forever

# Install Zero MQ
wget http://download.zeromq.org/zeromq-4.0.3.tar.gz
tar xzvf zeromq-4.0.3.tar.gz
cd zeromq-4.0.3
sudo ./configure
sudo make install
sudo sh -c "echo '/usr/local/lib' >> /etc/ld.so.conf"
sudo ldconfig
cd ../
sudo rm -rf zeromq-4.0.3
sudo rm -rf zeromq-4.0.3.tar.gz

# Install MongoDB 3.0
echo "[mongodb-org-3.0] name=MongoDB Repository baseurl=https://repo.mongodb.org/yum/amazon/2013.03/mongodb-org/3.0/x86_64/ gpgcheck=0 enabled=1" | sudo tee -a /etc/yum.repos.d/mongodb.repo

sudo yum install -y mongodb-org-3.0.6 mongodb-org-server-3.0.6 mongodb-org-shell-3.0.6 mongodb-org-mongos-3.0.6 mongodb-org-tools-3.0.6

sudo mkdir /data
sudo mkdir /data/db
export LC_ALL=C
sudo chkconfig mongod on
sudo service mongod start

# Create DB and users
echo 'db.createUser({"user":"root","pwd":"db1adm1n","roles":[{"role":"userAdmin","db":"sar"}]});' | mongo sar

# Clone Git Repo
cd /
sudo git clone https://github.com/OneviewCommerce/stock-module.git

# Import Database into Mongo
mongorestore --drop -d sar /stock-module/db

# Setup Config
cd /stock-module/client/config
echo "'use strict';
var config = angular.module('OVCstockApp.environmentConfigs', []);
config.constant('OVC_CONFIG', {
        'API_PATH': 'http://sarinstall1.ovcdemo.com:3000',
        'DASH_PATH':'http://gstarqa.ovcdemo.com/ovcdashboard/',
        'AUTH_PATH': 'sarinstall1.ovcdemo.com:5000',
});" | sudo tee environmentConfigs.js

# Start the services
cd /stock-module/Services/api_gateway
sudo npm install && sudo forever start bin/api_gateway.js

cd /stock-module/Services/oauth2
sudo npm install && sudo forever start app.js

cd /stock-module/Services/vendor
sudo npm install && sudo forever start bin/www

cd /stock-module/Services/product
sudo npm install && sudo forever start bin/www

cd /stock-module/Services/location
sudo npm install && sudo forever start bin/www

cd /stock-module/Services/transaction
sudo npm install && sudo forever start bin/www

cd /stock-module/Services/order
sudo npm install && sudo forever start bin/www
