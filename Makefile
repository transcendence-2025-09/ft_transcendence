up:
	docker-compose up -d --build

down:
	docker-compose down -v

setup:
	brew install volta
	volta install node@22.19.0
	volta install pnpm@10.17.1

	pnpm install && pnpm build

	ln -s ${PWD}/.env ${PWD}/apps/game/.env
	ln -s ${PWD}/.env ${PWD}/apps/frontend/.env
	ln -s ${PWD}/.env ${PWD}/apps/backend/.env

link-env:
	ln -s ${PWD}/.env ${PWD}/apps/game/.env
	ln -s ${PWD}/.env ${PWD}/apps/frontend/.env
	ln -s ${PWD}/.env ${PWD}/apps/backend/.env
