ARG IMAGE_TAG=3.12
FROM alpine:${IMAGE_TAG} AS builder

ARG GIT_NAME
ARG GIT_REV
ENV GIT_NAME ${GIT_NAME:-lets-fiware}
ENV GIT_REV ${GIT_REV:-master}

RUN apk add --no-cache --update nodejs nodejs-npm git && \
    cd /opt && \
    git clone https://github.com/${GIT_NAME}/custom-iotagent-sakuraio.git && \
    cd custom-iotagent-sakuraio/ && \
    git checkout ${GIT_REV} && \
    echo "INFO: npm install --production..." && \
    npm install --production && \
    rm -fr .git

FROM alpine:3.12 AS runner

COPY --from=builder /opt/ /opt/
WORKDIR /opt/custom-iotagent-sakuraio
RUN apk add --no-cache --update nodejs

ARG IOTA_NORTH_PORT
EXPOSE ${IOTA_NORTH_PORT:-4041}

USER guest
ENV NODE_ENV=production

ENTRYPOINT ["/usr/bin/node"]
CMD ["bin/iotagent-sakuraio"]
