container = fisuda/custom-iot-agent-sakuraio
build-args = --build-arg GIT_NAME=lets-fiware --build-arg GIT_REV=master

build:
	docker build --no-cache ${build-args} -t $(container) .
pull:
	docker pull $(container)
