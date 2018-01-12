# stock-module

#Overview
Microservice concept implemented. Each services will work as a independent application.

#API gateway

• It is hosted in aws. It runs in 3000 port. It works as Broker/Router, which gets the request from client and pass it to relevant Microservices.
V endor

• It manage all the Vendor relevant services.
Product

• It manage all the Product relevant services.
Location

• It manage all the Location relevant services.

#Project structure
All the node project having standard package structure.

• bin folder - Generally the bin folder having a file which contains node scripts to Initiate the node application. We have to run this file to start node application.

• config / app.son - Here we will maintain all the configurations like Db credentials, Api-gateway hosting address, image path and static contents.

• node_modules folder - The Imported node packages will be stored here.

• src folder - Business logics will be saved here.

• package.json - Having all the scripts to import the necessary packages.

• npm-debug.log - Log file having all the debugging data.

#Package Import
Before start the Application we have to import the npm package. Package.json having all the scripts to import the necessary packages.

• cd projectpath/projectname￼￼

• npm install

#Setting Application Configuration
We have a config file (app.json) in each node package. Here we will maintain all the configurations like DB credentials, Api-gateway host address, image paths and static contents. To view the file

• vi config/app.json

#Run the Application
To run the application we have to do the bellow steps

• Install forever package globally . This will run the node script continuously. If it is already installed then skip this step

⁃ npm install forever -g

• Start the node script using forever plugin.

⁃ forever start ./bin/www • To stop the node script

⁃ forever stop ./bin/www
