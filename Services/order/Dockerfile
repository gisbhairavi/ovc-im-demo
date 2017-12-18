FROM oneviewcommerce/sar-base:master

RUN apt-get install -y build-essential g++ && \
	mkdir -p /opt/stock-module/Services/order
     
COPY . /opt/stock-module/Services/order 

RUN cd /opt/stock-module/Services/order && \
  	/usr/bin/npm install 
  	
EXPOSE 3000 
		
CMD cd /opt/stock-module/Services/order && \
	node  bin/www 

RUN apt-get clean && \
    apt-get purge --auto-remove -y build-essential wget