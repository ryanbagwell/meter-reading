#utility monitoring

##Scripts to read and log my water and electric meters' radio output

###To start the receiver daemon:

    sudo daemon -n rtl_tcp \
    -u root \
    -r \
    -X "rtl_tcp -a 192.168.10.172 >> /var/log/rtltcp.log 2>&1" \
    -o /var/log/rtl-tcp.log \
    -l /var/log/rtl-tcp.log

###To run the monitoring and logging facility:

    ./node_modules/.bin/forever start ./dist/reader.js -l meter-reader.log -v -d

###To run the monitoring and logging facility as a daemon:

   To Do.