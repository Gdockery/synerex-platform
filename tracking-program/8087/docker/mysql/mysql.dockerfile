from mysql:5.7.18

ENV MYSQL_ROOT_PASSWORD xecopass
ENV MYSQL_DATABASE synerex

RUN echo "echo \"GRANT ALL PRIVILEGES ON *.* TO root@'%' identified by 'xecopass'\" | mysql" >> /usr/local/bin/docker-entrypoint.sh
