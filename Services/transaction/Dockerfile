FROM oneviewcommerce/sar-base:STOCK-386_Docker_deployment

RUN apt-get install -y build-essential g++ && \
	mkdir -p /opt/stock-module/Services/transaction
     
COPY . /opt/stock-module/Services/transaction 

RUN cd /opt/stock-module/Services/transaction && \
  	/usr/bin/npm install 
  	
EXPOSE 3000 
		
CMD cd /opt/stock-module/Services/transaction && \
	node  bin/www 

RUN apt-get clean && \
    apt-get purge --auto-remove -y build-essential wget