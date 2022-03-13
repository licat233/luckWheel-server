FROM golang:alpine AS builder

LABEL stage=gobuilder
ENV CGO_ENABLED 0
ENV GOOS linux
ENV GOPROXY https://goproxy.cn,direct

WORKDIR /build
ADD go.mod .
ADD go.sum .
RUN go mod download
COPY app/ app/
COPY config.yaml .
COPY main.go .
RUN go build -ldflags="-s -w" -o luckserver

FROM alpine

RUN apk update --no-cache && apk add --no-cache tzdata redis supervisor
ENV TZ Asia/Shanghai
WORKDIR /build
COPY luckview/client luckview/client
COPY static static
COPY view view
COPY config.yaml .
COPY --from=builder /build/luckserver .
COPY supervisord.conf /etc/supervisord.conf
EXPOSE 80
ENTRYPOINT ["supervisord","-c"]
CMD ["/etc/supervisord.conf"]