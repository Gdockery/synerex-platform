# Copy our version of the the Nginx conf into the deployment directory.
rm -f /etc/nginx/conf.d/*
cp eb/config/web_staging/nginx.conf /tmp/deployment/config/#etc#nginx#conf.d#00_elastic_beanstalk_proxy.conf

# Add iptables rules to forward port 81 traffic to port 8082
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 81 -j REDIRECT --to-port 8082
iptables -t nat -A OUTPUT -p tcp --dport 81 -o lo -j REDIRECT --to-port 8082

# Save the iptables rules in case of restart.
service iptables save
