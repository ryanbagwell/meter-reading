#utility monitoring

##Scripts to read and log my water and electric meters' radio output

###To start the receiver daemon:

    ./node_modules/.bin/forever start -l rtl-tcp.log -o rtl-tcp.log -e rtl-tcp.log -a -c /bin/bash ./scripts/run_rtl_tcp.sh

###To run the monitoring and logging facility as a daemon:

    ./node_modules/.bin/forever start -l meters.log -o meters.log -e meters.log -a ./dist/reader.js