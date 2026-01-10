up:
	docker-compose up -d --build

down:
	docker-compose down -v

link-env:
	ln -s ${PWD}/.env ${PWD}/apps/game/.env
	ln -s ${PWD}/.env ${PWD}/apps/frontend/.env
	ln -s ${PWD}/.env ${PWD}/apps/backend/.env
