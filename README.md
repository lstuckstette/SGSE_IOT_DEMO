# NodeJS installation guide for rasp0 / armv61:
1. cd ~
2. wget https://nodejs.org/dist/latest/node-v10.5.0-linux-armv6l.tar.gz (see https://nodejs.org/dist/latest/ for newest)
3. tar -xzf node-v10.5.0-linux-armv6l.tar.gz
4. cd node-v10.5.0-linux-armv6l
5. sudo cp -R * /usr/local/
6. export PATH=$PATH:/usr/local/bin

# How to run this project:
1. git clone https://github.com/lstuckstette/SGSE_IOT_DEMO
2. cd SGSE_IOT_DEMO
3. npm install
4. npm start
5. profit