
forever stopall

export API_PORT=3000

export AUTH_PORT=5000

export API_PATH=http://192.168.1.70:3000
# export DASH_PATH=http://192.168.1.28/dashboard/src/main/php/

# export DASH_PATH=http://192.168.1.28/dashboard/src/main/php/
# export DASH_PATH=http://192.168.1.69/ovcdashboard/src/main/php/

# export DASH_PATH=https://qamysql.ovcdemo.com/ovcdashboard/
export DASH_PATH=http://apparel-dash.ovcdemo.com/ovcdashboard/


# export DASH_PATH=https://mbqa-dash.ovcdemo.com/ovcdashboard/

# export DASH_PATH=https://qadash.ovcdemo.com/ovcdashboard/

# export DASH_PATH=http://gstarqa.ovcdemo.com/ovcdashboard/


export AUTH_PATH=http://192.168.1.70:5000

export DB_CONN=mongodb://localhost:27017/sar

export BROKER_PATH=tcp://127.0.0.1:3008

export BROADCAST_PATH=tcp://*:3008

export JMS_PATH=testjms.com
export JMS_PATH=http://gstarqa.ovcdemo.com:8080/json/jmshandler
# export JMS_PATH=http://192.168.1.18:8080/json/jmshandler

# export POS_PATH=https://qadash.ovcdemo.com/json

# export POS_PATH=http://192.168.1.24:8080/json

export POS_PATH=https://dev.ovcdemo.com:4443/json

# export POS_PATH=https://bluepos.ovcdemo.com/json


# export POS_PATH=http://gstarqa.ovcdemo.com:8080/json

# export POS_PATH=http://192.168.1.19:8080/json



export JMS_QUEUE_POS=localDev

export JMS_QUEUEPOCONFIRMED=testConfirmed

export JMS_QUEUEPOASN=testPoAsn

export CLIENT_PORT=8484

export JMS_QUEUE_PO_SUBMIT=testPoSubmit11111

export JMS_QUEUESTOCKEXPORT=testExport
export JMS_QUEUEINVBALEXPORT=stockSync
export JMS_QUEUE_ADJUST_EXPORT=testAdjustment 

export JMS_QUEUE_RETURN_EXPORT=testreturn

forever start runner.json

echo "Server Started...."
echo "Check forever list"
