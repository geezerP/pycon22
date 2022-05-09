FROM node:10.10.0-alpine
RUN apk add --no-cache bash curl 

# install python app
WORKDIR /usr/src/python-app
RUN apk add --update-cache python3 python3-dev py-pip build-base \
  	# && pip install virtualenv \
  	&& rm -rf /var/cache/apk/*
	
COPY python-src/requirements.txt ./
RUN pip install --upgrade pip \
	&& pip3 install -r requirements.txt 
	# virtualenv venv \
	# && source venv/bin/activate \
	# && pip3 install -r requirements.txt
COPY python-src .

# install nodejs-app
WORKDIR /usr/src/nodejs-app
RUN yarn global add nodemon

COPY nodejs-src/package.json nodejs-src/package-lock.json ./
RUN npm install
COPY nodejs-src .

COPY wait.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/wait.sh

CMD ["node", "."]

# ref: https://github.com/nodejs/docker-node/blob/master/docs/BestPractices.md
# https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
# https://runnable.com/blog/9-common-dockerfile-mistakes