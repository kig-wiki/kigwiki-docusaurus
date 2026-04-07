FROM node:24

WORKDIR /app

# Trust mounted repo paths (host UID/GID) so Git works for Docusaurus 3.10+ VCS; site may live in a subfolder of the mount
RUN git config --global --add safe.directory '*'


COPY package*.json ./

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--host", "0.0.0.0"] 