FROM oneviewcommerce/sar-base:master

RUN apt-get install -y build-essential g++ && \
	mkdir -p /opt/stock-module/Services/api_gateway
     
COPY . /opt/stock-module/Services/api_gateway 

RUN cd /opt/stock-module/Services/api_gateway && \
  	/usr/bin/npm install 
  	
EXPOSE 3000 
		
CMD cd /opt/stock-module/Services/api_gateway && \
	node  bin/api_gateway.js 

RUN apt-get clean && \
    apt-get purge --auto-remove -y build-essential wget
