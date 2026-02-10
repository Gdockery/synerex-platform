# Copy our version of the the Nginx conf into the deployment directory.
rm -f /etc/nginx/conf.d/*
cp eb/config/web_demo/nginx.conf /tmp/deployment/config/#etc#nginx#conf.d#00_elastic_beanstalk_proxy.conf
