FROM oneviewcommerce/sar-base:master

RUN apt-get install -y build-essential g++ && \
	mkdir -p /opt/stock-module/Services/oauth2
     
COPY . /opt/stock-module/Services/oauth2

RUN cd /opt/stock-module/Services/oauth2 && \
  	/usr/bin/npm install 
  	
EXPOSE 3000 
		
CMD cd /opt/stock-module/Services/oauth2 && \
	node  app.js 

RUN apt-get clean && \
    apt-get purge --auto-remove -y build-essential wget