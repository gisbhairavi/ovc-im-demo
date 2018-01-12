FROM debian

RUN apt-get -y update && apt-get install -y build-essential g++  \
    wget && \
    useradd -M -r stock && \
    mkdir -p /opt/stock-module

RUN apt-get -y install libkrb5-dev &&  \
    apt-get -y install curl && \
    curl -sL https://deb.nodesource.com/setup_4.x |  bash - && \ 
    apt-get -y install nodejs && \
    npm -g install forever && \
  npm -g install node-gyp && \
	wget  http://download.zeromq.org/zeromq-4.0.3.tar.gz && \
  	tar xzvf zeromq-4.0.3.tar.gz && \
  	cd zeromq-4.0.3 && \
  	./configure  && \
 	make install  && \
  	sh -c echo '/usr/local/lib' >> /etc/ld.so.conf && \
  	ldconfig && \
  	cd ../ && \
  	rm -rf zeromq-4.0.3 && \
  	rm -rf zeromq-4.0.3.tar.gz 
  	
EXPOSE 3000 

RUN apt-get clean && \
    apt-get purge --auto-remove -y build-essential wget
