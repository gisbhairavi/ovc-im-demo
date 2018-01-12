FROM debian

RUN apt-get -y update && apt-get install -y build-essential g++ \
    wget && \
    useradd -M -r stock && \
    mkdir -p /opt/stock-module/client
     
COPY . /opt/stock-module/client 

RUN apt-get -y install libkrb5-dev &&  \
    apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup_4.x |  bash - && \ 
    apt-get -y install nodejs && \
    npm -g install forever && \
    npm -g install node-gyp && \
    cd /opt/stock-module/client  && \
    /usr/bin/npm install 
    
EXPOSE 3000 

CMD cd /opt/stock-module/client && \
	node  server.js

RUN apt-get clean && \
    apt-get purge --auto-remove -y build-essential wget
