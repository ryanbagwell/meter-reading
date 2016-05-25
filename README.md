#utility monitoring

##Scripts to read and log my water and electric meters' radio output

###To start the receiver daemon:

    sudo daemon -n rtl_tcp \
    -u root \
    -X "rtl_tcp -a 192.168.10.172 >> /var/log/rtltcp.log 2>&1"

###To run the monitoring and logging facility:

    ./node_modules/.bin/babel-node --plugins babel-plugin-transform-es2015-destructuring index.js
