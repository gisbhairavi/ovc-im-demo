FROM oneviewcommerce/sar-base:master

RUN apt-get install -y build-essential g++ && \
	mkdir -p /opt/stock-module/Services/vendor
     
COPY . /opt/stock-module/Services/vendor 

RUN cd /opt/stock-module/Services/vendor && \
  	/usr/bin/npm install 
  	
EXPOSE 3000 
		
CMD cd /opt/stock-module/Services/vendor && \
	node  bin/www 

RUN apt-get clean && \
    apt-get purge --auto-remove -y build-essential wget